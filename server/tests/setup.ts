import { beforeAll } from "bun:test";
import { Migrator } from "@utils/migrations";
import * as config from "@config";
import { FastifyWebServer } from "@/webserver";
import { PostgresConnection } from "@/connections/pg";

// Migrates database before testing

beforeAll(async () => {
  const server = new FastifyWebServer({ modules: [] });
  const fastify = server._pureFastifyInstance();
  await server._fastifyRegisterConnections(fastify, [
    PostgresConnection
  ]);
  await fastify.ready();

  const migrator = new Migrator(
    fastify.pg,
    config.MIGRATIONS_DIRECTORY
  );
  await migrator.ensureMigrationsTable();
  await migrator.up();

  await fastify.close();
});
