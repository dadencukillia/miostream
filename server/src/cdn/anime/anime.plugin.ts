import type { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions } from "fastify";
import * as schemas from "./anime.schema";
import * as controllers from "./anime.controller";
import { AnimeCoverErrors } from "./anime.errors";

const modulePlugin: FastifyPluginAsync = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  AnimeCoverErrors.setupErrorHandler(fastify);

  fastify.get('/:animeId.webp', { schema: schemas.GetAnimeCoverSchema }, controllers.getAnimeCoverController);
};

export default modulePlugin;
