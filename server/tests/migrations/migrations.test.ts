import { afterAll, afterEach, beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { Pool } from "pg";
import * as config from "../../src/config";
import { Migrator } from "../../src/utils/migrations";

const SCHEMA = "test";
const pool = new Pool({ connectionString: config.DB_URL });

function fixture(name: string) {
  return path.join(import.meta.dir, "fixtures", name);
}

function createMigrator(fixtureName: string) {
  return new Migrator(pool, fixture(fixtureName), SCHEMA);
}

// Creates a migrator and makes sure the tracking table exists
async function prepareMigrator(fixtureName: string) {
  const migrator = createMigrator(fixtureName);
  await migrator.ensureMigrationsTable();
  return migrator;
}

async function tableExists(table: string) {
  const result = await pool.query(
    "SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2",
    [SCHEMA, table]
  );
  return result.rows.length > 0;
}

async function columnExists(table: string, column: string) {
  const result = await pool.query(
    "SELECT 1 FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 AND column_name = $3",
    [SCHEMA, table, column]
  );
  return result.rows.length > 0;
}

// Returns [from, to] pairs of all recorded operations in execution order
async function getHistory() {
  const result = await pool.query(
    `SELECT from_migration, to_migration FROM ${SCHEMA}.schema_migrations ORDER BY operation_id`
  );
  return result.rows.map(row => [Number(row.from_migration), Number(row.to_migration)]);
}

beforeEach(async () => {
  spyOn(console, "log").mockImplementation(() => {});
  spyOn(console, "error").mockImplementation(() => {});

  await pool.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
  await pool.query(`CREATE SCHEMA ${SCHEMA}`);
});

afterEach(() => {
  mock.restore();
});

afterAll(async () => {
  await pool.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
  await pool.end();
});

describe("constructor", () => {
  it("throws when the file name has no dash", () => {
    expect(() => createMigrator("invalid-name")).toThrow("invalid migration file name");
  });

  it("throws when the file name does not start with a number", () => {
    expect(() => createMigrator("no-timestamp")).toThrow("migration file name must have a timestamp");
  });
});

describe("ensureMigrationsTable", () => {
  it("creates the tracking table and can be called repeatedly", async () => {
    const migrator = createMigrator("valid");

    await migrator.ensureMigrationsTable();
    await migrator.ensureMigrationsTable();

    expect(await tableExists("schema_migrations")).toBe(true);
  });
});

describe("getDatabaseMigrationState", () => {
  it("returns null when nothing was applied", async () => {
    const migrator = await prepareMigrator("valid");

    expect(await migrator.getDatabaseMigrationState(pool)).toBeNull();
  });
});

describe("up", () => {
  it("applies all migrations in numeric order", async () => {
    const migrator = await prepareMigrator("valid");

    await migrator.up();

    expect(await tableExists("users")).toBe(true);
    expect(await tableExists("posts")).toBe(true);
    expect(await columnExists("posts", "published_at")).toBe(true);
    expect(await migrator.getDatabaseMigrationState(pool)).toBe(10);
    expect(await getHistory()).toEqual([[-1, 1], [1, 2], [2, 10]]);
  });

  it("does nothing when the database is up to date", async () => {
    const migrator = await prepareMigrator("valid");

    await migrator.up();
    await migrator.up();

    expect(await getHistory()).toHaveLength(3);
  });

  it("does nothing for a directory without migrations", async () => {
    const emptyDir = mkdtempSync(path.join(tmpdir(), "migrations-"));
    try {
      const migrator = new Migrator(pool, emptyDir, SCHEMA);
      await migrator.ensureMigrationsTable();

      await migrator.up();

      expect(await getHistory()).toEqual([]);
    } finally {
      rmSync(emptyDir, { recursive: true });
    }
  });

  it("applies only migrations newer than the current state", async () => {
    const migrator = await prepareMigrator("valid");
    await migrator.up();
    await migrator.down();

    await migrator.up();

    expect(await migrator.getDatabaseMigrationState(pool)).toBe(10);
    expect(await getHistory()).toEqual([[-1, 1], [1, 2], [2, 10], [10, 2], [2, 10]]);
  });

  it("rolls back a failed migration and keeps the previous ones", async () => {
    const migrator = await prepareMigrator("broken-up");

    (await expect(migrator.up())).rejects.toThrow("does not exist");

    expect(await tableExists("users")).toBe(true);
    expect(await tableExists("broken")).toBe(false);
    expect(await migrator.getDatabaseMigrationState(pool)).toBe(1);
    expect(await getHistory()).toEqual([[-1, 1]]);
  });

  it("fails before applying anything when the downgrade section is missing", async () => {
    const migrator = await prepareMigrator("missing-down");

    (await expect(migrator.up())).rejects.toThrow("no downgrade section in 1 migration");

    expect(await tableExists("items")).toBe(false);
    expect(await getHistory()).toEqual([]);
  });

  it("fails before applying anything when the upgrade section is missing", async () => {
    const migrator = await prepareMigrator("missing-up");

    (await expect(migrator.up())).rejects.toThrow("no upgrade section in 1 migration");

    expect(await getHistory()).toEqual([]);
  });

  it("applies each migration once when run concurrently", async () => {
    const first = await prepareMigrator("valid");
    const second = createMigrator("valid");

    await Promise.all([first.up(), second.up()]);

    expect(await getHistory()).toEqual([[-1, 1], [1, 2], [2, 10]]);
  });
});

describe("down", () => {
  it("does nothing when no migrations were applied", async () => {
    const migrator = await prepareMigrator("valid");

    await migrator.down();

    expect(await getHistory()).toEqual([]);
  });

  it("rolls back only the latest migration", async () => {
    const migrator = await prepareMigrator("valid");
    await migrator.up();

    await migrator.down();

    expect(await columnExists("posts", "published_at")).toBe(false);
    expect(await tableExists("posts")).toBe(true);
    expect(await migrator.getDatabaseMigrationState(pool)).toBe(2);
    expect(await getHistory()).toEqual([[-1, 1], [1, 2], [2, 10], [10, 2]]);
  });

  it("returns to the empty state after rolling back everything", async () => {
    const migrator = await prepareMigrator("valid");
    await migrator.up();

    await migrator.down();
    await migrator.down();
    await migrator.down();

    expect(await tableExists("posts")).toBe(false);
    expect(await tableExists("users")).toBe(false);
    expect(await migrator.getDatabaseMigrationState(pool)).toBeNull();

    // Another call has nothing to roll back
    await migrator.down();
    expect(await getHistory()).toHaveLength(6);
  });

  it("allows applying everything again after a full rollback", async () => {
    const migrator = await prepareMigrator("valid");
    await migrator.up();
    await migrator.down();
    await migrator.down();
    await migrator.down();

    await migrator.up();

    expect(await tableExists("users")).toBe(true);
    expect(await migrator.getDatabaseMigrationState(pool)).toBe(10);
  });

  it("keeps the state when the downgrade query fails", async () => {
    const migrator = await prepareMigrator("broken-down");
    await migrator.up();

    expect(await tableExists("items")).toBe(true);
    expect(await migrator.getDatabaseMigrationState(pool)).toBe(2);
    expect(await getHistory()).toEqual([[-1, 1], [1, 2]]);

    (await expect(migrator.down())).rejects.toThrow("does not exist");

    expect(await tableExists("items")).toBe(true);
    expect(await migrator.getDatabaseMigrationState(pool)).toBe(2);
    expect(await getHistory()).toEqual([[-1, 1], [1, 2]]);
  });

  it("throws when the applied migration has no file", async () => {
    await (await prepareMigrator("valid")).up();

    // This directory only has migrations 1 and 2, but the database is at 10
    const other = createMigrator("broken-up");

    (await expect(other.down())).rejects.toThrow("migration is not found for downgrade");
  });
});

