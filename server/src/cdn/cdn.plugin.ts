import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import avatar from "./avatar/avatar.plugin";
import animeCover from "./anime/anime.plugin";

export default async function(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  fastify.register(avatar, { prefix: "/avatar" });
  fastify.register(animeCover, { prefix: "/anime" });
}
