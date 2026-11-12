import type { FastifyPluginCallback } from "fastify";
import anime from "./anime/anime.plugin"
import user from "./user/user.plugin";
import list from "./list/list.plugin";

const plugin: FastifyPluginCallback = async (fastify, _opts) => {
  fastify.register(user, { prefix: "/users" });
  fastify.register(anime, { prefix: "/anime" });
  fastify.register(list, { prefix: "/list" });
};

export default plugin;
