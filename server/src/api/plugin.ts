import type { FastifyPluginCallback } from "fastify";
import auth from "./auth/plugin";
import anime from "./anime/anime.plugin"
import user from "./user/user.plugin";

const plugin: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.register(auth, { prefix: "/auth" });
  fastify.register(user, { prefix: "/users" });
  fastify.register(anime, { prefix: "/anime" });

  done();
};

export default plugin;
