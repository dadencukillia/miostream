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

  fastify.get('/:avatarId.webp', { schema: schemas.getAvatarSchema }, controllers.getAvatarController);
};

export default modulePlugin;
