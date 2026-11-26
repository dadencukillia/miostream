import type { FastifyPluginAsync, FastifyInstance, FastifyPluginOptions } from "fastify";
import { EpisodeErrors } from "./episode.errors";
import { grantAuthMiddleware } from "../auth/auth.middleware";
import * as schemas from "./episode.schema";
import * as controllers from "./episode.controller";
import { challengeMiddleware } from "@utils/challengeMiddleware";

const requireAdmin = grantAuthMiddleware({ userHasRole: ["admin"] });

const modulePlugin: FastifyPluginAsync = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  EpisodeErrors.setupErrorHandler(fastify, [EpisodeErrors], true, true);

  fastify.get("/", { schema: schemas.GetEpisodeListSchema }, controllers.getEpisodesList);
  fastify.get("/:episodeId", { schema: schemas.GetEpisodeSchema, preHandler: challengeMiddleware({
    challengeDeadlineSeconds: 10,
    hardLevel: 2,
    scopeSlug: "episode"
  }) }, controllers.getEpisode);

  // Staff only restricted endpoints

  fastify.post("/", { schema: schemas.CreateEpisodeSchema, preHandler: requireAdmin }, controllers.postEpisode);
  fastify.patch("/:episodeId/after/:prevEpisodeId", { schema: schemas.SetEpisodeAfterSchema, preHandler: requireAdmin }, controllers.setEpisodeAfter);
  fastify.put("/:episodeId", {  schema: schemas.PutEpisodeSchema, preHandler: requireAdmin }, controllers.putEpisode);
  fastify.delete("/:episodeId", { schema: schemas.DeleteEpisodeSchema, preHandler: requireAdmin }, controllers.deleteEpisode);
};

export default modulePlugin;
