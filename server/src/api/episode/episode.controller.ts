import { FastifyReply, FastifyRequest } from "fastify";
import {
  AnimeIdRequestParamsType,
  CreateEpisodeRequestPayloadType,
  CreateEpisodeReturnType,
  DeleteEpisodeReturnType,
  EpisodeIdRequestParamsType,
  GetEpisodeListReturnType,
  GetEpisodeReturnType,
  PutEpisodeReturnType,
  SetEpisodeAfterRequestParamsType,
  SetEpisodeAfterReturnType,
  UpdateEpisodeRequestPayloadType
} from "./episode.dto";
import * as services from "./episode.service";
import { EpisodeErrors } from "./episode.errors";

export const getEpisodesList = async (
  request: FastifyRequest<{
    Params: AnimeIdRequestParamsType;
    Reply: GetEpisodeListReturnType
  }>,
  reply: FastifyReply<{
    Params: AnimeIdRequestParamsType;
    Reply: GetEpisodeListReturnType
  }>
) => {
  const tree = await services.getEpisodesTreeByAnime(request.server.pg, request.params.animeId);
  return reply.send(tree);
};

export const getEpisode = async (
  request: FastifyRequest<{
    Params: EpisodeIdRequestParamsType;
    Reply: GetEpisodeReturnType
  }>,
  reply: FastifyReply<{
    Params: EpisodeIdRequestParamsType;
    Reply: GetEpisodeReturnType
  }>
) => {
  const episode = await services.getEpisodeById(
    request.server.pg,
    request.params.animeId,
    request.params.episodeId.toString()
  );

  return reply.send({
    episodeId: request.params.episodeId.toString(),
    ...episode
  });
};

export const postEpisode = async (
  request: FastifyRequest<{
    Params: AnimeIdRequestParamsType;
    Body: CreateEpisodeRequestPayloadType;
    Reply: CreateEpisodeReturnType
  }>,
  reply: FastifyReply<{
    Params: AnimeIdRequestParamsType;
    Body: CreateEpisodeRequestPayloadType;
    Reply: CreateEpisodeReturnType
  }>
) => {
  if (!["sub", "dub", null].includes(request.body.localizationType)) {
    throw EpisodeErrors.error("invalid-localization-type")
      .withDetails(request.body.localizationType);
  }

  const createdEpisode = await services.safeCreateEpisode(request.server.pg, {
    ...request.body,
    animeId: request.params.animeId
  });
  return reply.send(createdEpisode);
};

export const setEpisodeAfter = async (
  request: FastifyRequest<{
    Params: SetEpisodeAfterRequestParamsType;
    Reply: SetEpisodeAfterReturnType
  }>,
  reply: FastifyReply<{
    Params: SetEpisodeAfterRequestParamsType;
    Reply: SetEpisodeAfterReturnType
  }>
) => {
  if (request.params.episodeId.toString().trim() === request.params.prevEpisodeId.toString().trim()) {
    throw EpisodeErrors.error("same-previous-episode-id").withDetails(request.params.episodeId);
  }

  const prevEpisodeId = request.params.prevEpisodeId.toString() === "start"
    ? null : request.params.prevEpisodeId.toString();

  await services.safeSetEpisodeAfterEpisode(
    request.server.pg,
    request.params.episodeId.toString(),
    prevEpisodeId,
    request.params.animeId
  );

  const animeList = await services.getEpisodesTreeByAnime(request.server.pg, request.params.animeId);
  return reply.send(animeList);
};

export const putEpisode = async (
  request: FastifyRequest<{
    Params: EpisodeIdRequestParamsType;
    Body: UpdateEpisodeRequestPayloadType;
    Reply: PutEpisodeReturnType
  }>,
  reply: FastifyReply<{
    Params: EpisodeIdRequestParamsType;
    Body: UpdateEpisodeRequestPayloadType;
    Reply: PutEpisodeReturnType
  }>
) => {
  if (!["sub", "dub", null].includes(request.body.newLocalizationType)) {
    throw EpisodeErrors.error("invalid-localization-type")
      .withDetails(request.body.newLocalizationType);
  }

  const updatedEpisode = await services.safePutEpisode(request.server.pg, {
    ...request.body,
    episodeId: request.params.episodeId.toString(),
    animeId: request.params.animeId
  });
  return reply.send(updatedEpisode);
};

export const deleteEpisode = async (
  request: FastifyRequest<{
    Params: EpisodeIdRequestParamsType;
    Reply: DeleteEpisodeReturnType
  }>,
  reply: FastifyReply<{
    Params: EpisodeIdRequestParamsType;
    Reply: DeleteEpisodeReturnType
  }>
) => {
  await services.safeDeleteEpisode(
    request.server.pg,
    request.params.episodeId.toString(),
    request.params.animeId
  );

  return reply.status(204).send(null);
};
