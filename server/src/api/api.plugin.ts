import type { FastifyPluginAsync } from "fastify";
import anime from "./anime/anime.plugin"
import user from "./user/user.plugin";
import list from "./list/list.plugin";
import comment from "./comment/comment.plugin";
import auth from "./auth/auth.plugin";

const plugin: FastifyPluginAsync = async (fastify, _opts) => {
  fastify.register(user, { prefix: "/user" });
  fastify.register(anime, { prefix: "/anime" });
  fastify.register(list, { prefix: "/list" });
  fastify.register(comment, { prefix: "/anime/:animeId/comment" });
  fastify.register(auth, { prefix: "/auth" });
};

export default plugin;
