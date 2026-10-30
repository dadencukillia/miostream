import { PathLike, readdirSync } from "node:fs";
import path from "node:path";
import { Client, Pool } from "pg";

const UPGRADE_PART_LINE = "-- migrate:up";
const DOWNGRADE_PART_LINE = "-- migrate:down";

async function pgWrapClient<T>(pg: Pool, callback: (client: Client) => Promise<T>, fallback?: (e: unknown) => void): Promise<T> {
  const client = await pg.connect();
  try {
    return await callback(client);
  } catch(e) {
    if (fallback) fallback(e);
    throw e;
  } finally {
    client.release();
  }
}

async function pgWrapLock<T>(client: Client, callback: (client: Client) => Promise<T>, fallback?: (e: unknown) => void): Promise<T> {
  const LOCK_ID = 757667149;

  await client.query("SELECT pg_advisory_lock($1);", [ LOCK_ID ]);
  try {
    return await callback(client);
  } catch(e) {
    if (fallback) fallback(e);
    throw e;
  } finally {
    await client.query("SELECT pg_advisory_unlock($1);", [ LOCK_ID ]);
  }
}

async function pgWrapTransaction(client: Client, callback: (client: Client) => Promise<void>, fallback?: (e: unknown) => void) {
  await client.query("BEGIN;");

  try {
    await callback(client);
    await client.query("COMMIT;");
  } catch(e) {
    await client.query("ROLLBACK;");
    if (fallback) fallback(e);
    throw e;
  }
}

class MigrationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Represents a single migration file, handling its path validation, timestamp extraction,
 * and parsing of upgrade/downgrade SQL query sections.
 */
class MigrationEntry {
  private _path: string;
  private _timestamp: number;
  private _upQuery: string|null = null;
  private _downQuery: string|null = null;

  /**
   * Creates an instance of MigrationEntry.
   * 
   * @param migrationPath - Path to the migration SQL file.
   * @throws {MigrationError} If the filename format is invalid or lacks a numeric timestamp.
   */
  public constructor(migrationPath: PathLike) {
    this._path = migrationPath.toString();
    const basename = path.basename(this._path);
    const split = basename.split("-");
    if (split.length < 2) throw new MigrationError("invalid migration file name");

    const [timestampPart, ..._] = split;
    this._timestamp = Number(timestampPart);

    if (isNaN(this.timestamp)) throw new MigrationError("migration file name must have a timestamp");
  }

  /**
   * Parses the file content into upgrade and downgrade SQL query sections.
   * 
   * @param content - Raw string content of the migration file.
   * @returns An object containing `up` and `down` SQL query strings.
   * @throws {MigrationError} If upgrade or downgrade sections are missing or misspelled.
   */
  private parseMigrationQuery(content: string): {
    up: string,
    down: string
  } {
    let upPartFlag = false;
    let downPartFlag = false;
    let upPartContentLines = [];
    let downPartContentLines = [];

    for (const line of content.split("\n")) {
      const trim = line.trim();
      if (trim === UPGRADE_PART_LINE) {
        upPartFlag = true;
        downPartFlag = false;
      } else if (trim == DOWNGRADE_PART_LINE) {
        upPartFlag = false;
        downPartFlag = true;
      }
      else if (upPartFlag) upPartContentLines.push(line);
      else if (downPartFlag) downPartContentLines.push(line);
    }

    if (upPartContentLines.length === 0)
      throw new MigrationError(`no upgrade section in ${this._timestamp} migration, probably was misspelled`);
    if (downPartContentLines.length === 0)
      throw new MigrationError(`no downgrade section in ${this._timestamp} migration, probably was misspelled`);

    return {
      up: upPartContentLines.join("\n").trim(),
      down: downPartContentLines.join("\n").trim()
    };
  }

  /**
   * Reads and parses the migration file from disk, caching the resulting SQL queries.
   * 
   * @returns A promise resolving to an object containing `up` and `down` query strings.
   */
  public async parse(): Promise<{
    up: string,
    down: string
  }> {
    const content = await Bun.file(this._path).text();
    const parts = this.parseMigrationQuery(content);

    this._upQuery = parts.up;
    this._downQuery = parts.down;

    return {
      up: this._upQuery,
      down: this._downQuery,
    }
  }

  /** Gets the unique numeric timestamp extracted from the migration filename. */
  public get timestamp(): number {
    return this._timestamp;
  }

  /** Gets the parsed upgrade SQL query. 
    *
    * @remarks
    * call the `parse` method a single time before use.
    */
  public get upQuery(): string {
    if (this._upQuery === null) throw new MigrationError("call parse() first");

    return this._upQuery;
  }

  /** Gets the parsed downgrade SQL query. 
    *
    * @remarks
    * call the `parse` method a single time before use.
    */
  public get downQuery(): string {
    if (this._downQuery === null) throw new MigrationError("call parse() first");

    return this._downQuery;
  }
}

/**
 * Handles discovery, execution, rollback, and state tracking of database schema migrations.
 */
export class Migrator {
  private db: Pool;
  private migrationsDirectory: string;
  private migrationFiles: Array<MigrationEntry>;

  /**
   * Initializes the Migrator instance, loading and sorting all migration files from the specified directory.
   * 
   * @param db - PostgreSQL connection pool.
   * @param migrationsDirectory - Path to the directory containing `.sql` migration files.
   */
  public constructor(db: Pool, migrationsDirectory: PathLike) {
    this.db = db;
    this.migrationsDirectory = migrationsDirectory.toString();

    this.migrationFiles = readdirSync(migrationsDirectory)
      .filter(dirFile => dirFile.toLowerCase().endsWith(".sql"))
      .map(dirFile => path.join(this.migrationsDirectory, dirFile))
      .map(dirFile => new MigrationEntry(dirFile))
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Ensures that the `schema_migrations` tracking table exists in the database.
   */
  public async ensureMigrationsTable() {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations(
        operation_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        from_migration BIGINT NOT NULL,
        to_migration BIGINT NOT NULL
      );
    `);
  }

  /**
   * Retrieves the current migration timestamp state from the database.
   * 
   * @param db - Active PostgreSQL pool or client connection.
   * @returns The latest applied migration timestamp, or `null` if no migrations have been executed.
   */
  public async getDatabaseMigrationState(db: Pool|Client): Promise<number|null> {
    const queryResult = await db.query(
      `SELECT to_migration FROM public.schema_migrations ORDER BY operation_id DESC LIMIT 1;`
    );

    if (queryResult.rows.length === 0) return null;
    const lastMigrationEntry = queryResult.rows[0];

    const toMigration = Number(lastMigrationEntry["to_migration"]);
    if (toMigration === -1 || isNaN(toMigration)) return null;
    return toMigration;
  }

  /**
   * Executes all pending upward migrations sequentially within transactions, protected by an advisory lock.
   */
  public async up() {
    await pgWrapClient(this.db, async client => {
      await pgWrapLock(client, async client => {
        let currentMigrationState = await this.getDatabaseMigrationState(client);
        const upMigrations = await Promise.all(
          this.migrationFiles
            .filter(migration => currentMigrationState === null || migration.timestamp > currentMigrationState)
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(async file => ({
              timestamp: file.timestamp,
              parts: await file.parse()
            }))
        );

        console.log("[Migrations] current state:", currentMigrationState);
        if (upMigrations.length === 0) {
          console.log(`[Migrations] up to date.`);
          return;
        } else {
          console.log(`[Migrations] ${upMigrations.length} migrations to do.`);
        }

        for (const migration of upMigrations) {
          const currentMigrationStateSQL = (
            currentMigrationState === null ? "-1" :
            isNaN(currentMigrationState) ? "-1" :
            currentMigrationState.toString()
          );

          await pgWrapTransaction(client, async client => {
            await client.query("INSERT INTO schema_migrations(from_migration, to_migration) VALUES($1, $2);", [currentMigrationStateSQL, migration.timestamp]);
            await client.query(migration.parts.up);
            currentMigrationState = migration.timestamp;
            console.log(`[Migrations] ${migration.timestamp} ✔`);
          }, () => console.error(`[Migrations] ${migration.timestamp} ✘`));
        }
      });
    }, () => console.log(`[Migrations] failed.`));

    console.log(`[Migrations] success.`);
  }

  /**
   * Rolls back the most recently applied migration (downward migration) inside a transaction with advisory locking.
   * 
   * @throws {MigrationError} If no migration is found to roll back.
   */
  public async down() {
    await pgWrapClient(this.db, async client => {
      await pgWrapLock(client, async client => {
        const currentMigrationState = await this.getDatabaseMigrationState(client);
        console.log("[Migrations] current state:", currentMigrationState);

        if (currentMigrationState === null) {
          console.log("[Migrations] no downgrades possible.");
          return;
        }

        const downMigrationList = this.migrationFiles
          .filter(migration => migration.timestamp === currentMigrationState);

        const prevMigrationList = this.migrationFiles
          .filter(migration => migration.timestamp < currentMigrationState)
          .sort((a, b) => a.timestamp - b.timestamp);

        if (downMigrationList.length === 0) {
          console.error("[Migrations] migration is not found.");
          throw new MigrationError("migration is not found for downgrade");
        }

        const downMigration = downMigrationList[0]!;
        const prevMigration = prevMigrationList[prevMigrationList.length - 1]?.timestamp ?? -1;
        const downMigrationContent = (await downMigration.parse()).down;

        await pgWrapTransaction(client, async client => {
          await client.query("INSERT INTO schema_migrations(from_migration, to_migration) VALUES($1, $2);", [currentMigrationState, prevMigration]);
          await client.query(downMigrationContent);
          console.log(`[Migrations] rollback ${currentMigrationState} ✔`);
        }, () => console.error(`[Migrations] rollback ${currentMigrationState} ✘`));

        console.log(`[Migrations] current state: ${prevMigration === -1 ? null : prevMigration}.`);
      });
    }, () => console.log("[Migrations] failed."));
  }
}
