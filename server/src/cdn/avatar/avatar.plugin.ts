import type { FastifyInstance } from "fastify";
import { getAvatarSchema, updateAvatarSchema, resetAvatarSchema } from "./avatar.schema";
import { getAvatarController, resetAvatarController, updateAvatarController } from "./avatar.controller";
import { AvatarErrors } from "./avatar.errors";

export default function(fastify: FastifyInstance, _opts: {}, done: () => void) {
  AvatarErrors.setupErrorHandler(fastify);

  fastify.get('/:avatarId(^[a-zA-Z0-9]{32}).webp', { schema: getAvatarSchema }, getAvatarController);

  // TODO: wrap auth middleware
  fastify.put('/', { schema: updateAvatarSchema }, updateAvatarController);

  // TODO: wrap auth middleware
  fastify.delete('/', { schema: resetAvatarSchema }, resetAvatarController);

  done();
}
