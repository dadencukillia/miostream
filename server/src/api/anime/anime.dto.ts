import type Type from "typebox";
import type {
	ANIME_FORMATS,
	ANIME_SORTS,
	ANIME_STATUSES,
	AnimeIdRequestParams,
	AnimeListResponse,
	AnimeResponse,
	AnimeSlugRequestParams,
	CreateAnimeRequestPayload,
	GENRES,
	ListAnimesRequestQueries,
	MPAA_RATINGS,
	PaginationResponse,
	UpdateAnimeRequestPayload,
} from "./anime.schema";

export type AnimeResponseType = Type.Static<typeof AnimeResponse>;
export type CreateAnimeRequestPayloadType = Type.Static<typeof CreateAnimeRequestPayload>;
export type UpdateAnimeRequestPayloadType = Type.Static<typeof UpdateAnimeRequestPayload>;
export type ListAnimesRequestQueriesType = Type.Static<typeof ListAnimesRequestQueries>;
export type AnimeListResponseType = Type.Static<typeof AnimeListResponse>;
export type PaginationResponseType = Type.Static<typeof PaginationResponse>;
export type AnimeIdRequestParamsType = Type.Static<typeof AnimeIdRequestParams>;
export type AnimeSlugRequestParamsType = Type.Static<typeof AnimeSlugRequestParams>;

export type AnimeFormatType = (typeof ANIME_FORMATS)[number];
export type AnimeStatusType = (typeof ANIME_STATUSES)[number];
export type AgeRestrictionType = (typeof MPAA_RATINGS)[number];
export type GenreType = (typeof GENRES)[number];
export type AnimeSortType = (typeof ANIME_SORTS)[number];

// Normalized filters used by the service/repository layer
export interface AnimeListFilterType {
	search: string | null;
	genre: GenreType | null;
	status: AnimeStatusType | null;
	format: AnimeFormatType | null;
	year: number | null;
	available: boolean | null;
	sort: AnimeSortType;
	limit: number;
	offset: number;
}