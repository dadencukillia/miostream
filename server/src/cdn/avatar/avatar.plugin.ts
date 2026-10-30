import type { FastifyInstance } from "fastify";
import { getAvatarSchema, updateAvatarSchema, resetAvatarSchema } from "./avatar.schema";
import { getAvatarController, resetAvatarController, updateAvatarController } from "./avatar.controller";
import { AvatarError } from "./avatar.errors";

export default function(fastify: FastifyInstance, _opts: {}, done: () => void) {
  fastify.setErrorHandler<Error>((error, request, reply) => {
    if (error instanceof AvatarError) {
      return reply
        .status(error.status)
        .send({
          ok: false,
          message: error.message,
        });
    }

    request.log.error(error);
    return reply
      .status(500)
      .send({
        ok: false,
        message: error.message
      });
  });

  fastify.get('/:avatarId(^[a-zA-Z0-9]{32}).webp', { schema: getAvatarSchema }, getAvatarController);

  // TODO: wrap auth middleware
  fastify.put('/', { schema: updateAvatarSchema }, updateAvatarController);

  // TODO: wrap auth middleware
  fastify.delete('/', { schema: resetAvatarSchema }, resetAvatarController);

  done();
}
