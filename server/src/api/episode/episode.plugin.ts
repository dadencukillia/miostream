import type { FastifyPluginAsync, FastifyInstance, FastifyPluginOptions } from "fastify";
import { EpisodeErrors } from "./episode.errors";
import { grantAuthMiddleware } from "../auth/auth.middleware";

const requireAdmin = grantAuthMiddleware({ userHasRole: ["admin"] });

const modulePlugin: FastifyPluginAsync = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  EpisodeErrors.setupErrorHandler(fastify, [EpisodeErrors], true, true);

  fastify.get("/", {}, () => {});
  fastify.get("/:episodeId", {}, () => {});

  // Staff only restricted endpoints

  fastify.post("/", { preHandler: requireAdmin }, () => {});
  fastify.patch("/:episodeId/after/:prevEpisodeId", { preHandler: requireAdmin }, () => {});
  fastify.put("/:episodeId", { preHandler: requireAdmin }, () => {});
  fastify.delete("/:episodeId", { preHandler: requireAdmin }, () => {});
};

export default modulePlugin;
