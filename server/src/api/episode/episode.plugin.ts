import type { FastifyPluginAsync, FastifyInstance, FastifyPluginOptions } from "fastify";
import { EpisodeErrors } from "./episode.errors";

const modulePlugin: FastifyPluginAsync = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  EpisodeErrors.setupErrorHandler(fastify, [EpisodeErrors], true, true);
};

export default modulePlugin;
