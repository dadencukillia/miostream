import type { FastifyPluginAsync, FastifyError, FastifyInstance, FastifyPluginOptions } from "fastify";
import { AnimeErrors } from "./anime.errors";
import * as schemas from "./anime.schema";
import { grantAuthMiddleware } from "@/api/auth/auth.middleware";
import * as controllers from "./anime.controller";

const modulePlugin: FastifyPluginAsync = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  AnimeErrors.setupErrorHandler(fastify);

  fastify.get("/", { schema: schemas.listAnimesRouteSchema }, controllers.listAnimes);
  fastify.get("/:idOrSlug", { schema: schemas.getAnimeRouteSchema }, controllers.getAnime);
  fastify.post("/", { schema: schemas.createAnimeRouteSchema, preHandler: grantAuthMiddleware({ userHasRole: ["admin"] }) as any }, controllers.createAnime);
  fastify.patch("/:id", { schema: schemas.updateAnimeRouteSchema, preHandler: grantAuthMiddleware({ userHasRole: ["admin"] }) as any }, controllers.updateAnime);
  fastify.delete("/:id", { schema: schemas.deleteAnimeRouteSchema, preHandler: grantAuthMiddleware({ userHasRole: ["admin"] }) as any }, controllers.deleteAnime);

  fastify.get("/stats/by-status", controllers.countByStatus);
  fastify.get("/stats/by-studio", controllers.studioStats);
  fastify.get("/stats/by-format", controllers.formatStats);
  fastify.get("/stats/studios-above-average", controllers.studiosAboveAverage);
  fastify.get("/stats/above-average-episodes", controllers.aboveAverageEpisodes);
  fastify.get("/stats/max-episodes", controllers.maxEpisodes);
};

export default modulePlugin;