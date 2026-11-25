import { Null, Type } from "typebox";
import { ErrorResponse } from "@lib/errorsCollection";
import { BigIntIdResponseType, Nullable, StringEnum } from "@utils/types";

// Primitives

const LocalizationType = StringEnum(["sub", "dub"]);

// Params

export const AnimeIdRequestParams = Type.Object({
  animeId: Type.String({ format: "uuid", description: "Anime UUID" }),
});

export const EpisodeIdRequestParams = Type.Object({
  animeId: Type.String({ format: "uuid", description: "Anime UUID" }),
  episodeId: BigIntIdResponseType,
});

export const SetEpisodeAfterRequestParams = Type.Object({
  animeId: Type.String({ format: "uuid", description: "Anime UUID" }),
  episodeId: BigIntIdResponseType,
  prevEpisodeId: Nullable(BigIntIdResponseType),
});

// Payloads

export const CreateEpisodeRequestPayload = Type.Object(
  {
    animeId: Type.String({ format: "uuid", description: "Anime UUID" }),
    sourceUrl: Type.String({ format: "uri" }),
    episodeName: Type.String({ minLength: 1, maxLength: 255 }),
    localizationStudio: Type.String({ default: "", maxLength: 255 }),
    localizationType: Nullable(LocalizationType),
  },
  { additionalProperties: false },
);

export const UpdateEpisodeRequestPayload = Type.Object(
  {
    episodeId: BigIntIdResponseType,
    animeId: Type.String({ format: "uuid", description: "Anime UUID" }),
    newSourceUrl: Type.String({ format: "uri" }),
    newEpisodeName: Type.String({ minLength: 1, maxLength: 255 }),
    newLocalizationStudio: Type.String({ default: "", maxLength: 255 }),
    newLocalizationType: Nullable(LocalizationType),
  },
  { additionalProperties: false },
);

// Responses

export const EpisodeListResponse = Type.Object({
  sub: Type.Record(Type.String({ description: "Localization studio name" }), Type.Array(
    Type.Object({
      episodeId: BigIntIdResponseType,
      episodeName: Type.String(),
    })
  )),
  dub: Type.Record(Type.String({ description: "Localization studio name" }), Type.Array(
    Type.Object({
      episodeId: BigIntIdResponseType,
      episodeName: Type.String(),
    })
  )),
  unknown: Type.Record(Type.String({ description: "Localization studio name" }), Type.Array(
    Type.Object({
      episodeId: BigIntIdResponseType,
      episodeName: Type.String(),
    })
  )),
});

export const EpisodeResponse = Type.Object({
  episodeId: BigIntIdResponseType,
  animeId: Type.String({ format: "uuid" }),
  sourceUrl: Type.String(),
  episodeName: Type.String(),
  localizationStudio: Type.String(),
  localizationType: Nullable(LocalizationType),
});

// Schemas

export const GetEpisodeListSchema = {
  params: AnimeIdRequestParams,
  response: {
    200: EpisodeListResponse,
    404: ErrorResponse,
  },
};

export const GetEpisodeSchema = {
  params: EpisodeIdRequestParams,
  response: {
    200: EpisodeResponse,
    404: ErrorResponse,
  },
};

export const CreateEpisodeSchema = {
  params: AnimeIdRequestParams,
  body: CreateEpisodeRequestPayload,
  response: {
    201: EpisodeResponse,
    404: ErrorResponse,
    409: ErrorResponse,
  },
};

export const SetEpisodeAfterSchema = {
  params: SetEpisodeAfterRequestParams,
  response: {
    200: EpisodeListResponse,
    404: ErrorResponse,
    422: ErrorResponse,
  },
};

export const PutEpisodeSchema = {
  params: EpisodeIdRequestParams,
  body: UpdateEpisodeRequestPayload,
  response: {
    200: EpisodeResponse,
    404: ErrorResponse,
    409: ErrorResponse,
  },
};

export const DeleteEpisodeSchema = {
  params: EpisodeIdRequestParams,
  response: {
    204: Type.Null(),
    404: ErrorResponse,
  },
};
