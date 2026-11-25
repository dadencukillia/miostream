import { Type } from "typebox";
import { ErrorResponse } from "@lib/errorsCollection";
import { BigIntIdResponseType, Nullable, StringEnum } from "@utils/types";
import { FastifySchema } from "fastify";

const EPISODE_TAG = "Episode";

// Primitives

const AnimeId = Type.String({ format: "uuid", description: "Anime UUID" });
const LocalizationType = StringEnum(["sub", "dub"]);
const EpisodeName = Type.String({ minLength: 1, maxLength: 255, examples: ["EP1", "EP0.5", "SPECIAL"] });
const SourceUrl = Type.String({ format: "url", minLength: 1, examples: ["https://miostream.dev/cdn/animeEpisode.m3u"] });
const LocalizationStudio = Type.String({ minLength: 1, maxLength: 100, examples: ["PrettyDub", "SpicyVoice"] });

// Params

export const AnimeIdRequestParams = Type.Object({
  animeId: Type.String({ format: "uuid", description: "Anime UUID" }),
}, { additionalProperties: false });

export const EpisodeIdRequestParams = Type.Object({
  animeId: AnimeId,
  episodeId: BigIntIdResponseType,
}, { additionalProperties: false });

export const SetEpisodeAfterRequestParams = Type.Object({
  animeId: AnimeId,
  episodeId: BigIntIdResponseType,
  prevEpisodeId: Type.Union([BigIntIdResponseType, Type.Literal("start")], {
    description: "Specify another episode's ID here to set the episode after him or set \"start\" to make the episode first",
    examples: ["223", "start"]
  }),
}, { additionalProperties: false });

// Payloads

export const CreateEpisodeRequestPayload = Type.Object(
  {
    sourceUrl: SourceUrl,
    episodeName: EpisodeName,
    localizationStudio: LocalizationStudio,
    localizationType: Nullable(LocalizationType),
  },
  { additionalProperties: false },
);

export const UpdateEpisodeRequestPayload = Type.Object(
  {
    newSourceUrl: SourceUrl,
    newEpisodeName: EpisodeName,
    newLocalizationStudio: LocalizationStudio,
    newLocalizationType: Nullable(LocalizationType),
  },
  { additionalProperties: false },
);

// Responses

export const EpisodeListResponse = Type.Object({
  sub: Type.Record(Type.String({ description: "Localization studio name" }), Type.Array(
    Type.Object({
      episodeId: BigIntIdResponseType,
      episodeName: EpisodeName,
    })
  )),
  dub: Type.Record(Type.String({ description: "Localization studio name" }), Type.Array(
    Type.Object({
      episodeId: BigIntIdResponseType,
      episodeName: EpisodeName,
    })
  )),
  unknown: Type.Record(Type.String({ description: "Localization studio name" }), Type.Array(
    Type.Object({
      episodeId: BigIntIdResponseType,
      episodeName: EpisodeName,
    })
  )),
}, { examples: [
  {
    sub: {
      SpicyVoice: [
        { episodeId: "12", episodeName: "EP1 - Hello, truck-kun" },
        { episodeId: "10", episodeName: "EP2 - Unlucky merchant" },
      ],
      NewEraSub: [
        { episodeId: "14", episodeName: "EP1 - Hello, truck-kun" },
        { episodeId: "25", episodeName: "EP2 - Unlucky merchant" },
        { episodeId: "26", episodeName: "EP3 - The road to the capital" },
      ]
    },
    dub: {
      MasterDub: [
        { episodeById: "5", episodeName: "EP0.5 - Greet a twit" },
        { episodeById: "6", episodeName: "EP1 - Hello, truck-kun" },
      ]
    },
    unknown: {}
  }
] });

export const EpisodeResponse = Type.Object({
  episodeId: BigIntIdResponseType,
  animeId: AnimeId,
  sourceUrl: SourceUrl,
  episodeName: EpisodeName,
  localizationStudio: LocalizationStudio,
  localizationType: Nullable(LocalizationType),
});

// Schemas

export const GetEpisodeListSchema: FastifySchema = {
  tags: [EPISODE_TAG],
  summary: "Get episodes list of anime",
  params: AnimeIdRequestParams,
  response: {
    200: EpisodeListResponse,
    404: ErrorResponse,
    500: ErrorResponse,
  },
};

export const GetEpisodeSchema: FastifySchema = {
  tags: [EPISODE_TAG],
  summary: "Get additional episode's information",
  params: EpisodeIdRequestParams,
  response: {
    200: EpisodeResponse,
    404: ErrorResponse,
    500: ErrorResponse
  },
};

export const CreateEpisodeSchema: FastifySchema = {
  tags: [EPISODE_TAG],
  summary: "Create a new episode for anime",
  params: AnimeIdRequestParams,
  body: CreateEpisodeRequestPayload,
  response: {
    201: EpisodeResponse,
    404: ErrorResponse,
    500: ErrorResponse
  },
};

export const SetEpisodeAfterSchema: FastifySchema = {
  tags: [EPISODE_TAG],
  summary: "Change order of episode in single anime scope",
  params: SetEpisodeAfterRequestParams,
  response: {
    200: EpisodeListResponse,
    404: ErrorResponse,
    409: ErrorResponse,
    500: ErrorResponse
  },
};

export const PutEpisodeSchema: FastifySchema = {
  tags: [EPISODE_TAG],
  summary: "Rewrite episode entry",
  params: EpisodeIdRequestParams,
  body: UpdateEpisodeRequestPayload,
  response: {
    200: EpisodeResponse,
    404: ErrorResponse,
    500: ErrorResponse
  },
};

export const DeleteEpisodeSchema: FastifySchema = {
  tags: [EPISODE_TAG],
  summary: "Remove episode entry",
  params: EpisodeIdRequestParams,
  response: {
    204: Type.Null(),
    404: ErrorResponse,
    500: ErrorResponse
  },
};
