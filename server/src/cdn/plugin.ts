import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import avatar from "./avatar/avatar.plugin";

export default async function(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  fastify.register(avatar, { prefix: "/avatar" });
}
