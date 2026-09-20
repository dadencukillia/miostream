import type { FastifyPluginCallback } from "fastify";
import auth from "../controllers/auth.controller";

const plugin: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.get('/user', (request, reply) => {
    reply.send({ hello: 'world' });
  });

  fastify.register(auth, { prefix: "/auth" });

  done();
};

export default plugin;
