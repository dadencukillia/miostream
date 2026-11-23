import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import avatar from "./avatar/avatar.plugin";
import preview from "./preview/preview.plugin";

export default async function (fastify: FastifyInstance, _opts: FastifyPluginOptions) {
	fastify.register(preview, { prefix: "/preview" });
	fastify.register(avatar, { prefix: "/avatar" });
}
