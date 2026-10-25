import fastify from "fastify";
import connector from "../src/utils/connector";
import { PostgresConnection } from "../src/connections/pg";
import { beforeAll } from "bun:test";

// Migrates database before testing

beforeAll(async () => {
  const fastifyInstance = fastify({
    logger: false,
    pluginTimeout: 0,
  });

  fastifyInstance.register(connector, {
    connections: [PostgresConnection],
    interval: 1_000,
    retries: 3,
  });

  await fastifyInstance.ready();
  await fastifyInstance.close();
});
