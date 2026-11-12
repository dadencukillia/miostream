import type { FastifyPluginAsync, FastifyError, FastifyInstance, FastifyPluginOptions } from "fastify";
import { AnimeError } from "./anime.errors";
import * as schemas from "./anime.schema";
import * as controllers from "./anime.controller";

const modulePlugin: FastifyPluginAsync = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof AnimeError) {
      return reply.status(error.status).send({ ok: false, message: error.message });
    }
    if ((error as any).validation) {
      return reply.status(400).send({ ok: false, message: (error as any).message });
    }
    request.log.error(error);
    return reply.status(500).send({ ok: false, message: "unknown error" });
  });

  fastify.get("/", { schema: schemas.ListAnimesSchema }, controllers.listAnimes);
  fastify.get("/slug/:slug", { schema: schemas.GetAnimeBySlugSchema }, controllers.getAnimeBySlug);
  fastify.get("/:id", { schema: schemas.GetAnimeSchema }, controllers.getAnime);
  fastify.post("/", { schema: schemas.CreateAnimeSchema }, controllers.createAnime);
  fastify.patch("/:id", { schema: schemas.UpdateAnimeSchema }, controllers.updateAnime);
  fastify.delete("/:id", { schema: schemas.DeleteAnimeSchema }, controllers.deleteAnime);

  fastify.get("/stats/by-status", controllers.countByStatus);
  fastify.get("/stats/by-studio", controllers.studioStats);
  fastify.get("/stats/by-format", controllers.formatStats);
  fastify.get("/stats/studios-above-average", controllers.studiosAboveAverage);
  fastify.get("/stats/above-average-episodes", controllers.aboveAverageEpisodes);
  fastify.get("/stats/max-episodes", controllers.maxEpisodes);
};

export default modulePlugin;
