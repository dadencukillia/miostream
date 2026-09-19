import type { FastifyInstance } from "fastify";
import { getSchema, resetSchema, updateSchema } from "./schemas";
import { getAvatarController, resetAvatarController, updateAvatarController } from "./avatar.controller";

export default function(fastify: FastifyInstance, _opts: {}, done: () => void) {
  fastify.get('/:avatarId(^[a-zA-Z0-9]{32}).webp', { schema: getSchema }, getAvatarController);

  // TODO: wrap auth middleware, move to /api/user
  fastify.put('/', { schema: updateSchema }, updateAvatarController);

  // TODO: wrap auth middleware, move to /api/user
  fastify.delete('/', { schema: resetSchema }, resetAvatarController);

  done();
}
