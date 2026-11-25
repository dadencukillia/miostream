import type { Static } from "typebox";
import {
  AnimeIdRequestParams,
  CreateEpisodeRequestPayload,
  UpdateEpisodeRequestPayload,
  EpisodeListItemResponse,
  EpisodeListResponse,
  EpisodeResponse,
  SetEpisodeAfterRequestParams,
  EpisodeIdRequestParams
} from "./episode.schema.ts";
import { ErrorResponseReturnType } from "@lib/errorsCollection.ts";

// Params

export type AnimeIdRequestParamsType = Static<typeof AnimeIdRequestParams>;
export type SetEpisodeAfterRequestParamsType = Static<typeof SetEpisodeAfterRequestParams>;
export type EpisodeIdRequestParamsType = Static<typeof EpisodeIdRequestParams>;

// Payloads

export type CreateEpisodeRequestPayloadType = Static<typeof CreateEpisodeRequestPayload>;
export type UpdateEpisodeRequestPayloadType = Static<typeof UpdateEpisodeRequestPayload>;

// Responses

export type EpisodeListItemResponseType = Static<typeof EpisodeListItemResponse>;
export type EpisodeListResponseType = Static<typeof EpisodeListResponse>;
export type EpisodeResponseType = Static<typeof EpisodeResponse>;

// Schemas

export type GetEpisodeListReturnType = EpisodeListResponseType | ErrorResponseReturnType;
export type GetEpisodeReturnType = EpisodeResponseType | ErrorResponseReturnType;
export type CreateEpisodeReturnType = EpisodeResponseType | ErrorResponseReturnType;
export type SetEpisodeAfterReturnType = EpisodeListResponseType | ErrorResponseReturnType;
export type PutEpisodeReturnType = EpisodeResponseType | ErrorResponseReturnType;
export type DeleteEpisodeReturnType = null | ErrorResponseReturnType;
