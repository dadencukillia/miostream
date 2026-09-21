import type { FastifyPluginCallback } from "fastify";
import auth from "./auth/plugin";
import { authMiddleware } from "./auth/auth.middleware";

const plugin: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.get('/user', { preHandler: authMiddleware }, (request, reply) => {
    reply.send({ hello: 'world' });
  });

  fastify.register(auth, { prefix: "/auth" });

  done();
};

export default plugin;
