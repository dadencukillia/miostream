import type { FastifyPluginAsync, FastifyError, FastifyInstance, FastifyPluginOptions } from "fastify";
import { AnimeError } from "./anime.errors";
import * as schemas from "./anime.schema";
import * as controllers from "./anime.controller";

const modulePlugin: FastifyPluginAsync = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
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

  fastify.get("/", { schema: schemas.listAnimesRouteSchema }, controllers.listAnimes);
  //TODO: summ slug + id
  fastify.get("/slug/:slug", { schema: schemas.getAnimeBySlugRouteSchema }, controllers.getAnimeBySlug);
  fastify.get("/:id", { schema: schemas.getAnimeRouteSchema }, controllers.getAnime);
  fastify.post("/", { schema: schemas.createAnimeRouteSchema }, controllers.createAnime);
  fastify.patch("/:id", { schema: schemas.updateAnimeRouteSchema }, controllers.updateAnime);
  fastify.delete("/:id", { schema: schemas.deleteAnimeRouteSchema }, controllers.deleteAnime);

  fastify.get("/stats/by-status", controllers.countByStatus);
  fastify.get("/stats/by-studio", controllers.studioStats);
  fastify.get("/stats/by-format", controllers.formatStats);
  fastify.get("/stats/studios-above-average", controllers.studiosAboveAverage);
  fastify.get("/stats/above-average-episodes", controllers.aboveAverageEpisodes);
  fastify.get("/stats/max-episodes", controllers.maxEpisodes);
};

export default modulePlugin;
