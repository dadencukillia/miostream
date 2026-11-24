import { Type } from "typebox";
import { ErrorResponse } from "@lib/errorsCollection";
import { BigIntIdResponseType, Nullable, StringEnum } from "@utils/types";

// Primitives

const LocalizationType = StringEnum(["sub", "dub"]);

const episodeEditableProps = {
  sourceUrl: Type.String({ format: "uri" }),
  episodeName: Type.String({ minLength: 1, maxLength: 255 }),
  localizationStudio: Type.String({ default: "", maxLength: 255 }),
  localizationType: LocalizationType,
};

// Params

export const AnimeIdRequestParams = Type.Object({
  animeId: Type.String({ format: "uuid", description: "Anime UUID" }),
});

export const EpisodeIdRequestParams = Type.Object({
  animeId: Type.String({ format: "uuid" }),
  episodeId: BigIntIdResponseType,
});

export const SetEpisodeAfterRequestParams = Type.Object({
  animeId: Type.String({ format: "uuid" }),
  episodeId: BigIntIdResponseType,
  prevEpisodeId: Nullable(BigIntIdResponseType),
});

// Payloads

export const CreateUpdateEpisodeRequestPayload = Type.Object(
  {
    ...episodeEditableProps,
    localizationStudio: Type.Optional(episodeEditableProps.localizationStudio),
    localizationType: Type.Optional(LocalizationType),
  },
  { additionalProperties: false },
);

// Responses

export const EpisodeListItemResponse = Type.Object({
  episodeId: BigIntIdResponseType,
  episodeName: Type.String(),
  localizationStudio: Type.String(),
  localizationType: Nullable(LocalizationType),
});

export const EpisodeListResponse = Type.Array(EpisodeListItemResponse);

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
  body: CreateUpdateEpisodeRequestPayload,
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
  body: CreateUpdateEpisodeRequestPayload,
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
