import type { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions } from "fastify";
import * as schemas from "./avatar.schema";
import * as controllers from "./avatar.controller";
import { AvatarErrors } from "./avatar.errors";

const modulePlugin: FastifyPluginAsync = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  AvatarErrors.setupErrorHandler(fastify);

  fastify.get('/:avatarId.webp', { schema: schemas.GetAvatarSchema }, controllers.getAvatarController);
};

export default modulePlugin;
