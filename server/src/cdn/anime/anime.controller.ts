import type { FastifyReply, FastifyRequest } from "fastify";
import "@context";
import { getAnimeCover } from "./anime.service";
import type * as dtos from "./anime.dto";

export const getAnimeCoverController = async (
  request: FastifyRequest<{ Params: dtos.AnimeIdRequestParamsType }>,
  reply: FastifyReply<{ Params: dtos.AnimeIdRequestParamsType, Reply: dtos.GetAnimeCoverReturnType }>
) => {
  const { animeId } = request.params;

  const { body, etag } = await getAnimeCover(request.server.s3, request.log, animeId);

  if (etag && request.headers["if-none-match"] === etag) {
    return reply
      .code(304)
      .header("etag", etag)
      .header("cache-control", "public, max-age=3600")
      .send();
  }

  return reply
    .header("content-type", "image/webp")
    .header("etag", etag ?? undefined)
    .header("cache-control", "public, max-age=3600")
    .send(body);
};
