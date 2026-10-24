import { PathLike, readdirSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";

const UP_PART_LINE = "-- migrate:up";
const DOWN_PART_LINE = "-- migrate:down";

class MigrationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

class MigrationEntry {
  private _path: string;
  private _timestamp: number;
  private _upQuery: string|null = null;
  private _downQuery: string|null = null;

  constructor(migrationPath: PathLike) {
    this._path = migrationPath.toString();
    const basename = path.basename(this._path);
    const split = basename.split("-");
    if (split.length < 2) throw new MigrationError("invalid migration file name");

    const [timestampPart, ..._] = split;
    this._timestamp = Number(timestampPart);

    if (isNaN(this.timestamp)) throw new MigrationError("migration file name must have a timestamp");
  }

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
      if (trim === UP_PART_LINE) {
        upPartFlag = true;
        downPartFlag = false;
      } else if (trim == DOWN_PART_LINE) {
        upPartFlag = false;
        downPartFlag = true;
      }
      else if (upPartFlag) upPartContentLines.push(line);
      else if (downPartFlag) downPartContentLines.push(line);
    }

    if (upPartContentLines.length === 0)
      throw new MigrationError(`no migrate:up section in ${this._timestamp} migration, probably was misspelled`);
    if (downPartContentLines.length === 0)
      throw new MigrationError(`no migrate:down section in ${this._timestamp} migration, probably was misspelled`);

    return {
      up: upPartContentLines.join("\n"),
      down: downPartContentLines.join("\n")
    };
  }

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

  get timestamp(): number {
    return this._timestamp;
  }

  get upQuery(): string {
    if (this._upQuery === null) throw new MigrationError("call parse() first");

    return this._upQuery;
  }

  get downQuery(): string {
    if (this._downQuery === null) throw new MigrationError("call parse() first");

    return this._downQuery;
  }
}

export class Migrator {
  private db: Pool;
  private migrationsDirectory: string;
  private migrationFiles: Array<MigrationEntry>;

  constructor(db: Pool, migrationsDirectory: PathLike) {
    this.db = db;
    this.migrationsDirectory = migrationsDirectory.toString();

    this.migrationFiles = readdirSync(migrationsDirectory)
      .filter(dirFile => dirFile.toLowerCase().endsWith(".sql"))
      .map(dirFile => path.join(this.migrationsDirectory, dirFile))
      .map(dirFile => new MigrationEntry(dirFile))
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  async ensureMigrationsTable() {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations(
        operation_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        execution_time TIMESTAMPTZ NOT NULL DEFAULT now(),
        from_migration BIGINT NOT NULL,
        to_migration BIGINT NOT NULL
      );
    `);
  }

  async getDatabaseMigrationState(): Promise<number|null> {
    const queryResult = await this.db.query(
      `SELECT to_migration FROM public.schema_migrations ORDER BY operation_id DESC LIMIT 1;`
    );

    if (queryResult.rows.length === 0) return null;
    const lastMigrationEntry = queryResult.rows[0];

    const toMigration = Number(lastMigrationEntry["to_migration"]);
    if (toMigration === -1 || isNaN(toMigration)) return null;
    return toMigration;
  }

  async up() {
    let currentMigrationState = await this.getDatabaseMigrationState();
    const upMigrations = await Promise.all(
      this.migrationFiles
        .filter(migration => currentMigrationState === null || migration.timestamp > currentMigrationState)
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(async file => ({
          timestamp: file.timestamp,
          parts: await file.parse()
        }))
    );
    const client = await this.db.connect();
    console.log("[Migrations] current state:", currentMigrationState);
    if (upMigrations.length === 0) 
      console.log(`[Migrations] up to date.`);
    else
      console.log(`[Migrations] ${upMigrations.length} migrations to do.`);

    try {
      for (const migration of upMigrations) {
        const currentMigrationStateSQL = (
          currentMigrationState === null ? "-1" :
          isNaN(currentMigrationState) ? "-1" :
          currentMigrationState.toString()
        );

        try {
          await client.query("BEGIN;");
          await client.query(`INSERT INTO schema_migrations(from_migration, to_migration) VALUES(${currentMigrationStateSQL}, ${migration.timestamp});`);
          await client.query(migration.parts.up);
          await client.query("COMMIT;");
          currentMigrationState = migration.timestamp;
          console.log(`[Migrations] ${migration.timestamp} ✔`);
        } catch(err) {
          await client.query("ROLLBACK;");
          console.error(`[Migrations] ${migration.timestamp} ✘`);
          throw err;
        }
      }
    } catch(e) {
      console.log(`[Migrations] failed.`);
      throw e;
    } finally {
      client.release();
    }

    console.log(`[Migrations] success.`);
  }

  async down() {
    const currentMigrationState = await this.getDatabaseMigrationState();
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
    const client = await this.db.connect();

    try {
      await client.query("BEGIN;");
      await client.query(`INSERT INTO schema_migrations(from_migration, to_migration) VALUES(${currentMigrationState}, ${prevMigration});`);
      await client.query(downMigrationContent);
      await client.query("COMMIT;");
      console.log(`[Migrations] rollback ${currentMigrationState} ✔`);
    } catch(err) {
      console.error(`[Migrations] rollback ${currentMigrationState} ✘`);
      console.log("[Migrations] failed.");
      throw err;
    } finally {
      client.release();
    }

    console.log(`[Migrations] current state: ${prevMigration === -1 ? null : prevMigration}.`);
  }
}
