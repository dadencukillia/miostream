import type { FastifyPluginCallback } from "fastify";
import auth from "./auth/plugin";
import { requireAuth } from "./auth/middleware";

const plugin: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.get('/user', { preHandler: requireAuth }, (request, reply) => {
    reply.send({ hello: 'world' });
  });

  fastify.register(auth, { prefix: "/auth" });

  done();
};

export default plugin;
