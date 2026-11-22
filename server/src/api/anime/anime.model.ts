import { generateTransformer } from "@utils/modelTransformer";
import type {
	AgeRestrictionType,
	AnimeFormatType,
	AnimeStatusType,
	GenreType,
} from "./anime.dto";
import {
	ANIME_FORMATS,
	ANIME_STATUSES,
	GENRES,
	MPAA_RATINGS,
} from "./anime.schema";

const includes = (values: readonly string[], value: string) =>
	values.includes(value);

const toCoverUrl = (_coverId: string | null): string => {
	return "";
};

const toAgeRestriction = (value: string | null): AgeRestrictionType | null =>
	value !== null && includes(MPAA_RATINGS, value)
		? (value as AgeRestrictionType)
		: null;

const toAnimeStatus = (value: string | null): AnimeStatusType | null =>
	value !== null && includes(ANIME_STATUSES, value)
		? (value as AnimeStatusType)
		: null;

const toAnimeFormat = (value: string): AnimeFormatType =>
	includes(ANIME_FORMATS, value) ? (value as AnimeFormatType) : "other";

const toGenres = (values: string[] | null): GenreType[] =>
	(values ?? []).filter((value): value is GenreType => includes(GENRES, value));

export type AnimeTransformInput = {
	coverId: string | null;
	malId: string | null;
	anilistId: string | null;
	ageRestriction: string | null;
	animeStatus: string | null;
	animeFormat: string;
	genres: string[] | null;
};

export const toAnimeModel = generateTransformer({
	delete: [],
	map: (row: AnimeTransformInput) => ({
		coverUrl: toCoverUrl(row.coverId),
		malId: row.malId === null ? null : Number(row.malId),
		anilistId: row.anilistId === null ? null : Number(row.anilistId),
		ageRestriction: toAgeRestriction(row.ageRestriction),
		animeStatus: toAnimeStatus(row.animeStatus),
		animeFormat: toAnimeFormat(row.animeFormat),
		genres: toGenres(row.genres),
	}),
});