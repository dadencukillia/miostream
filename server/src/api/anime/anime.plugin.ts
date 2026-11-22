import type { FastifyPluginAsync, FastifyInstance, FastifyPluginOptions } from "fastify";
import { AnimeErrors } from "./anime.errors";
import * as schemas from "./anime.schema";
import { grantAuthMiddleware } from "@/api/auth/auth.middleware";
import * as controllers from "./anime.controller";

const modulePlugin: FastifyPluginAsync = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  AnimeErrors.setupErrorHandler(fastify, [AnimeErrors], true, true);

  fastify.get("/", { schema: schemas.ListAnimesSchema }, controllers.listAnimes);
  fastify.get("/:identifier", { schema: schemas.GetAnimeRouteSchema }, controllers.getAnime);
  fastify.post("/", { schema: schemas.CreateAnimeSchema, preHandler: grantAuthMiddleware({ userHasRole: ["admin"] }) }, controllers.createAnime);
  fastify.patch("/:id", { schema: schemas.UpdateAnimeSchema, preHandler: grantAuthMiddleware({ userHasRole: ["admin"] }) }, controllers.updateAnime);
  fastify.delete("/:id", { schema: schemas.DeleteAnimeSchema, preHandler: grantAuthMiddleware({ userHasRole: ["admin"] }) }, controllers.deleteAnime);

  fastify.get("/stats/by-status", { schema: schemas.CountByStatusSchema }, controllers.countByStatus);
  fastify.get("/stats/by-studio", { schema: schemas.StudioStatsSchema }, controllers.studioStats);
  fastify.get("/stats/by-format", { schema: schemas.FormatStatsSchema }, controllers.formatStats);
  fastify.get("/stats/studios-above-average", { schema: schemas.StudiosAboveAverageSchema }, controllers.studiosAboveAverage);
  fastify.get("/stats/above-average-episodes", { schema: schemas.AboveAverageEpisodesSchema }, controllers.aboveAverageEpisodes);
  fastify.get("/stats/max-episodes", { schema: schemas.MaxEpisodesSchema }, controllers.maxEpisodes);
};

export default modulePlugin;
