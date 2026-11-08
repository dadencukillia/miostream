import type Type from "typebox";
import type {
	ANIME_FORMATS,
	ANIME_SORTS,
	ANIME_STATUSES,
	AnimeIdParamsSchema,
	AnimeListResponseSchema,
	AnimeResponseSchema,
	AnimeSlugParamsSchema,
	CreateAnimeBodySchema,
	GENRES,
	ListAnimesQuerySchema,
	MPAA_RATINGS,
	PaginationSchema,
	UpdateAnimeBodySchema,
} from "./anime.schema";

export type AnimeResponseType = Type.Static<typeof AnimeResponseSchema>;
export type CreateAnimeBodyType = Type.Static<typeof CreateAnimeBodySchema>;
export type UpdateAnimeBodyType = Type.Static<typeof UpdateAnimeBodySchema>;
export type AnimeListQueryType = Type.Static<typeof ListAnimesQuerySchema>;
export type AnimeListResponseType = Type.Static<typeof AnimeListResponseSchema>;
export type PaginationType = Type.Static<typeof PaginationSchema>;
export type AnimeIdParamsType = Type.Static<typeof AnimeIdParamsSchema>;
export type AnimeSlugParamsType = Type.Static<typeof AnimeSlugParamsSchema>;

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
