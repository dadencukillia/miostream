import Fastify from "fastify";
import connector from "./utils/connector";
import { S3Connection } from "./connections/s3";
import api from "./api/plugin";
import cdn from "./cdn/plugin";
import { PostgresConnection } from "./connections/pg";

const fastify = Fastify({
  logger: true,
  pluginTimeout: 0,
  ajv: {
    customOptions: {
      unicodeRegExp: true,
      removeAdditional: false,
    }
  },
});

fastify.register(connector, {
  retries: 3,
  interval: 15 * 1000, // 15 seconds
  connections: [
    S3Connection,
    PostgresConnection,
  ],
});

fastify.get('/healthcheck', async (_request, reply) => {
  return reply.send({ health: true });
});

fastify.register(api, { prefix: "/api" });
fastify.register(cdn, { prefix: "/cdn" });

const start = async () => {
  try {
    await fastify.listen({ port: 8080, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

const shutdown = async () => {
  fastify.log.info('Stopping server and closing database pool...');
  await fastify.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
