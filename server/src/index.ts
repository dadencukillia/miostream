import Fastify from 'fastify';
import { UserController } from './api/user/user.controller';
import prisma, { pool } from './db';
import { UserRepository } from './api/user/user.repository';
import { UserService } from './api/user/user.service';

const fastify = Fastify({
  logger: true,
  ajv: {
    customOptions: {
      unicodeRegExp: true,
    }
  },
});

const userRepo = new UserRepository(prisma);
const userService = new UserService(userRepo);
const userController = new UserController(userService);

fastify.get('/healthcheck', async (_request, reply) => {
  return reply.send({ health: true });
});

fastify.register(userController.registerRoutes, { prefix: '/api/user' });

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