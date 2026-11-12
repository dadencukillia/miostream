import { beforeAll } from "bun:test";
import { Migrator } from "@utils/migrations";
import { Pool } from "pg";
import * as config from "@config";

// Migrates database before testing

beforeAll(async () => {
  const migrator = new Migrator(
    new Pool({ connectionString: config.DB_URL }),
    config.MIGRATIONS_DIRECTORY
  );
  await migrator.ensureMigrationsTable();
  await migrator.up();
});
