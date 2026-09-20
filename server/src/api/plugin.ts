import type { FastifyPluginCallback } from "fastify";
import authPlugin from "./auth/plugin/pluginAuth";
import { authMiddleware } from "./auth/controllers/auth.controller";

const plugin: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.get('/user', { preHandler: authMiddleware }, (request, reply) => {
    reply.send({ hello: 'world' });
  });

  fastify.register(authPlugin);

  done();
};

export default plugin;