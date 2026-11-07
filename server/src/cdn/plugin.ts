import type { FastifyInstance } from "fastify";
import avatar from "./avatar/avatar.plugin";

export default async function(fastify: FastifyInstance, _opts: {}) {
  fastify.register(avatar, { prefix: "/avatar" });
}
