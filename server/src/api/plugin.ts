import type { FastifyPluginCallback } from "fastify";
// import user from "./user/plugin";

const plugin: FastifyPluginCallback = (fastify, _opts, done) => {
  // TODO: rewrite user to the new model and SQLc
  // fastify.register(user, { prefix: "/user" });

  done();
};

export default plugin;
