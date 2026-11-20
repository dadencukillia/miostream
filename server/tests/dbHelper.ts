import { Pool, PoolClient } from "pg";
import * as config from "@config";

const pool = new Pool({ connectionString: config.DB_URL });

export function getDatabasePool(): Pool {
  return pool;
}

export async function getDatabaseClient(): Promise<PoolClient> {
  return pool.connect();
}

export async function wipeDatabaseTables(...tables: string[]) {
  for (const table of tables) {
    await pool.query(`DELETE FROM ${table};`);
  }
}
