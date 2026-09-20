import type { FastifyPluginCallback } from "fastify";
import auth from "../controllers/auth.controller";

const plugin: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.register(auth, { prefix: "/auth" });

  done();
};

export default plugin;