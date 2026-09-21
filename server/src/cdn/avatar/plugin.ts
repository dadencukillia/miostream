import type { FastifyInstance } from "fastify";
import { getSchema, resetSchema, updateSchema } from "./schemas";
import { getAvatarController, resetAvatarController, updateAvatarController } from "./avatar.controller";
import { AvatarError } from "./avatar.service";

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

  fastify.get('/:avatarId(^[a-zA-Z0-9]{32}).webp', { schema: getSchema }, getAvatarController);

  // TODO: wrap auth middleware
  fastify.put('/', { schema: updateSchema }, updateAvatarController);

  // TODO: wrap auth middleware
  fastify.delete('/', { schema: resetSchema }, resetAvatarController);

  done();
}
