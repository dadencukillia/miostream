import type { FastifyError, FastifyPluginCallback } from "fastify";
import auth from "./auth/plugin";
import * as animeController from "./anime/controller";
import { AnimeError } from "./anime/errors";
import * as animeSchema from "./anime/schema";

const plugin: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.register(auth, { prefix: "/auth" });

  fastify.setErrorHandler<FastifyError>((error, request, reply) => {
    if (error.validation) return reply.status(400).send({ ok: false, message: error.message });
    if (error instanceof AnimeError) return reply.status(error.status).send({ ok: false, message: error.message });
    request.log.error(error);
    return reply.status(500).send({ ok: false, message: "Unexpected error" });
  });

  fastify.get("/anime", { schema: animeSchema.listAnimesRouteSchema }, animeController.listAnimes);
  fastify.get("/anime/slug/:slug", { schema: animeSchema.getAnimeBySlugRouteSchema }, animeController.getAnimeBySlug);
  fastify.get("/anime/:id", { schema: animeSchema.getAnimeRouteSchema }, animeController.getAnime);
  fastify.post("/anime", { schema: animeSchema.createAnimeRouteSchema }, animeController.createAnime);
  fastify.patch("/anime/:id", { schema: animeSchema.updateAnimeRouteSchema }, animeController.updateAnime);
  fastify.delete("/anime/:id", { schema: animeSchema.deleteAnimeRouteSchema }, animeController.deleteAnime);

  fastify.get("/anime/stats/by-status", animeController.countByStatus);
  fastify.get("/anime/stats/by-studio", animeController.studioStats);
  fastify.get("/anime/stats/by-format", animeController.formatStats);
  fastify.get("/anime/stats/studios-above-average", animeController.studiosAboveAverage);
  fastify.get("/anime/stats/above-average-episodes", animeController.aboveAverageEpisodes);
  fastify.get("/anime/stats/max-episodes", animeController.maxEpisodes);

  done();
};

export default plugin;