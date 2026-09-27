import type { FastifyPluginCallback } from "fastify";
import auth from "./auth/plugin";
import user from "./user/plugin";

const plugin: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.register(auth, { prefix: "/auth" });
  fastify.register(user, { prefix: "/user" });

  done();
};

export default plugin;
