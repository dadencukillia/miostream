import type { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions } from "fastify";
import * as schemas from "./avatar.schema";
import * as controllers from "./avatar.controller";
import { AvatarError } from "./avatar.errors";

const modulePlugin: FastifyPluginAsync = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
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
        message: "unknown error"
      });
  });

  fastify.get('/:avatarId(^[a-zA-Z0-9]{32}).webp', { schema: schemas.getAvatarSchema }, controllers.getAvatarController);

  // TODO: wrap auth middleware
  fastify.put('/', { schema: schemas.updateAvatarSchema }, controllers.updateAvatarController);

  // TODO: wrap auth middleware
  fastify.delete('/', { schema: schemas.resetAvatarSchema }, controllers.resetAvatarController);
};

export default modulePlugin;
