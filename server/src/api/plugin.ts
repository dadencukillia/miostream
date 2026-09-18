import type { FastifyPluginCallback } from "fastify";

const plugin: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.get('/user', (request, reply) => {
    reply.send({ hello: 'world' });
  });

  done();
};

export default plugin;
