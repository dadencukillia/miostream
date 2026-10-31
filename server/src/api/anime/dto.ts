import type Type from "typebox";
import type {
	ANIME_FORMATS,
	ANIME_SORTS,
	ANIME_STATUSES,
	AnimeIdParamsSchema,
	AnimeListResponseSchema,
	AnimeSchema,
	AnimeSlugParamsSchema,
	CreateAnimeBodySchema,
	GENRES,
	ListAnimesQuerySchema,
	MPAA_RATINGS,
	PaginationSchema,
	UpdateAnimeBodySchema,
} from "./schema";

export type Anime = Type.Static<typeof AnimeSchema>;
export type CreateAnimeRequest = Type.Static<typeof CreateAnimeBodySchema>;
export type UpdateAnimeRequest = Type.Static<typeof UpdateAnimeBodySchema>;
export type AnimeListQuery = Type.Static<typeof ListAnimesQuerySchema>;
export type AnimeListResponse = Type.Static<typeof AnimeListResponseSchema>;
export type Pagination = Type.Static<typeof PaginationSchema>;
export type AnimeIdParams = Type.Static<typeof AnimeIdParamsSchema>;
export type AnimeSlugParams = Type.Static<typeof AnimeSlugParamsSchema>;

export type AnimeFormat = (typeof ANIME_FORMATS)[number];
export type AnimeStatus = (typeof ANIME_STATUSES)[number];
export type AgeRestriction = (typeof MPAA_RATINGS)[number];
export type Genre = (typeof GENRES)[number];
export type AnimeSort = (typeof ANIME_SORTS)[number];

// Normalized filters used by the service/repository layer
export interface AnimeListFilter {
	search: string | null;
	genre: Genre | null;
	status: AnimeStatus | null;
	format: AnimeFormat | null;
	year: number | null;
	available: boolean | null;
	sort: AnimeSort;
	limit: number;
	offset: number;
}