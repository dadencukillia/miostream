import type { FastifyPluginAsync } from "fastify";
import anime from "./anime/anime.plugin"
import user from "./user/user.plugin";

const plugin: FastifyPluginAsync = async (fastify, _opts) => {
  fastify.register(user, { prefix: "/user" });
  fastify.register(anime, { prefix: "/anime" });
};

export default plugin;
