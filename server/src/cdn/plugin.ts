import type { FastifyInstance } from "fastify";
import avatar from "./avatar/plugin";

export default function(fastify: FastifyInstance, _opts: {}, done: () => void) {
  fastify.register(avatar, { prefix: "/avatar" });

  done();
}
