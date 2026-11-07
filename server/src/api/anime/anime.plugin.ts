import type { FastifyPluginAsync, FastifyError } from "fastify";
import { AnimeError } from "./anime.errors";
import * as animeSchema from "./anime.schema";
import * as animeController from "./anime.controller";

const plugin: FastifyPluginAsync = async (fastify, _opts) => {
  fastify.setErrorHandler<FastifyError>((error, request, reply) => {
    if (reply.sent) return;

    if (error.validation) {
      return reply.status(400).send({
        ok: false,
        message: error.message,
      });
    }

    if (error instanceof AnimeError) {
      if (error.status >= 500) {
        request.log.error({ err: error }, error.message);
      }
      return reply
        .status(error.status)
        .send({ ok: false, message: error.message });
    }

    if (
      error.statusCode &&
      error.statusCode >= 400 &&
      !Number.isNaN(error.statusCode)
    ) {
      return reply
        .status(error.statusCode)
        .send({ ok: false, message: error.message });
    }

    request.log.error({ err: error }, "Unhandled server error");
    return reply.status(500).send({
      ok: false,
      message: "Unexpected error",
    });
  });

  fastify.get(
    "/",
    { schema: animeSchema.listAnimesRouteSchema },
    animeController.listAnimes,
  );
//TODO: summ slug + id
  fastify.get(
    "/slug/:slug",
    { schema: animeSchema.getAnimeBySlugRouteSchema },
    animeController.getAnimeBySlug,
  );
  fastify.get(
    "/:id",
    { schema: animeSchema.getAnimeRouteSchema },
    animeController.getAnime,
  );
//
  fastify.post(
    "/",
    { schema: animeSchema.createAnimeRouteSchema },
    animeController.createAnime,
  );
  fastify.patch(
    "/:id",
    { schema: animeSchema.updateAnimeRouteSchema },
    animeController.updateAnime,
  );
  fastify.delete(
    "/:id",
    { schema: animeSchema.deleteAnimeRouteSchema },
    animeController.deleteAnime,
  );

  fastify.get("/stats/by-status", animeController.countByStatus);
  fastify.get("/stats/by-studio", animeController.studioStats);
  fastify.get("/stats/by-format", animeController.formatStats);
  fastify.get(
    "/stats/studios-above-average",
    animeController.studiosAboveAverage,
  );
  fastify.get(
    "/stats/above-average-episodes",
    animeController.aboveAverageEpisodes,
  );
  fastify.get("/stats/max-episodes", animeController.maxEpisodes);
};

export default plugin;
