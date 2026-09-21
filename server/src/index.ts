import Fastify from 'fastify';
import prisma, { pool } from './db';
import api from "./api/plugin"

const fastify = Fastify({
  logger: true,
  ajv: {
    customOptions: {
      unicodeRegExp: true,
      removeAdditional: false,
    }
  },
});

fastify.get('/healthcheck', async (_request, reply) => {
  return reply.send({ health: true });
});

fastify.register(api, { prefix: '/api' });

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
  await prisma.$disconnect();
  await pool.end();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();