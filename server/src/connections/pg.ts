import { Pool } from 'pg';
import { Connection } from "../utils/connector";
import * as config from "../config";
import assert from 'assert';
import { Migrator } from '../utils/migrations';

async function migrateDB(db: Pool) {
  const migrator = new Migrator(db, "./db/migrations");
  await migrator.ensureMigrationsTable();
  await migrator.up();
}

export const PostgresConnection: Connection<Pool> = {
  /**
    * An PostgreSQL connection establisher for fastify-connector-plugin
    * Adds an "pg" decorator for the fastify instance
    *
    * @example
    * ```typescript
    * // fastify-connector-plugin adjustments
    * fastify.register(connector, {
    *   retries: 3,
    *   interval: 15 * 1000, // 15 seconds
    *   connections: [
    *     PostgresConnection
    *   ],
    * });
    *
    * await fastify.ready();
    *
    * const result = sqlc.insertNewUser(fastify.pg, { ... });
    * ```
    */

  name: "pg",

  async initFunc(_fastify) {
    const pool = new Pool({ connectionString: config.DB_URL });
    const queryResult = await pool.query("SELECT 'pong' AS ping;");
    assert(queryResult.rows[0].ping == "pong");
    await migrateDB(pool);

    return pool;
  },

  async dropFunc(_fastify, instance) {
    await instance.end();
  }
};
