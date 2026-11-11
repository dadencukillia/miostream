import type { Pool, PoolClient } from "pg";
import type {
	AgeRestrictionType,
	AnimeResponseType,
	AnimeFormatType,
	AnimeListFilterType,
	AnimeListQueryType,
	AnimeListResponseType,
	AnimeStatusType,
	CreateAnimeBodyType,
	GenreType,
	UpdateAnimeBodyType,
} from "./anime.dto";
import { AnimeErrors } from "./anime.errors";
import {
	countAnimes,
	createAnime as createAnimeQuery,
	createAnimeGenres,
	listAnimes as listAnimeRows,
	updateAnimeById,
	getAnimeById,
	getAnimeBySlug as getAnimeBySlugQuery,
	countAnimesByStatus as countAnimesByStatusQuery,
	getFormatStats as getFormatStatsQuery,
	getStudioStats as getStudioStatsQuery,
	getStudiosAboveAverageEpisodes,
	getOngoingAnimes,
	getAvailableAnimesByCurrentYear,
} from "@sqlc/animes_sql";
import { ANIME_FORMATS, ANIME_STATUSES, GENRES, MPAA_RATINGS } from "./anime.schema";

const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const includes = (values: readonly string[], value: string) =>
	values.includes(value);

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

/** Maps a SQL row (camelCase) to the public API shape (camelCase). */
export const toAnime = (row: AnimeRecord): AnimeResponseType => ({
	animeId: row.animeId,
	slug: row.slug,
	titleUa: row.titleUa,
	titleEn: row.titleEn,
	titleOriginal: row.titleOriginal,
	animeDescription: row.animeDescription,
	coverUrl: row.coverUrl,
	productionStudio: row.productionStudio,
	malId: row.malId === null ? null : Number(row.malId),
	anilistId: row.anilistId === null ? null : Number(row.anilistId),
	hikkaId: row.hikkaId,
	imdbId: row.imdbId,
	yearReleased: row.yearReleased,
	avgEpisodeDuration: row.avgEpisodeDuration,
	episodesCount: row.episodesCount,
	ageRestriction: toAgeRestriction(row.ageRestriction),
	animeStatus: toAnimeStatus(row.animeStatus),
	animeFormat: toAnimeFormat(row.animeFormat),
	available: row.available,
	genres: toGenres(row.genres),
});

function handleDbError(error: unknown): never {
	const dbError = error as {
		code?: string;
		detail?: string;
		constraint?: string;
		message?: string;
	};

	if (dbError.code === "23505") {
		const detail = `${dbError.detail ?? ""} ${dbError.constraint ?? ""}`;

		if (detail.includes("slug")) {
			throw AnimeErrors.error("anime-already-exists").withMessage("Anime with this slug already exists");
		}
		if (detail.includes("mal_id")) {
			throw AnimeErrors.error("anime-already-exists").withMessage(
				"Anime with this MAL ID already exists",
			);
		}
		if (detail.includes("anilist_id")) {
			throw AnimeErrors.error("anime-already-exists").withMessage(
				"Anime with this AniList ID already exists",
			);
		}
		if (detail.includes("hikka_id")) {
			throw AnimeErrors.error("anime-already-exists").withMessage(
				"Anime with this Hikka ID already exists",
			);
		}
		if (detail.includes("imdb_id")) {
			throw AnimeErrors.error("anime-already-exists").withMessage(
				"Anime with this IMDb ID already exists",
			);
		}

		throw AnimeErrors.error("anime-already-exists").withMessage(
			"Anime with the same unique fields already exists",
		);
	}

	if (dbError.code === "22P02") {
		throw AnimeErrors.error("anime-invalid").withMessage("Invalid data format or enum value");
	}
	if (dbError.code === "22001") {
		throw AnimeErrors.error("anime-invalid").withMessage("Field value exceeds maximum allowed length");
	}
	if (dbError.code === "23514") {
		throw AnimeErrors.error("anime-invalid").withMessage("Value violates a database constraint");
	}
	if (dbError.code === "23503") {
		throw AnimeErrors.error("anime-invalid").withMessage("Related record does not exist");
	}
	if (dbError.code === "23502") {
		throw AnimeErrors.error("anime-invalid").withMessage("Required field is missing");
	}

	throw error;
}

function assertValidId(id: string) {
	if (!id?.trim()) throw AnimeErrors.error("anime-invalid").withMessage("Anime ID is required");
	if (!UUID_RE.test(id)) {
		throw AnimeErrors.error("anime-invalid").withMessage("Anime ID must be a valid UUID");
	}
}

function assertValidSlug(slug: string) {
	if (!slug?.trim()) throw AnimeErrors.error("anime-invalid").withMessage("Slug is required");
	if (slug.length > 200) {
		throw AnimeErrors.error("anime-invalid").withMessage("Slug must not exceed 200 characters");
	}
	if (!SLUG_RE.test(slug)) {
		throw AnimeErrors.error("anime-invalid").withMessage(
			"Slug must contain only lowercase latin letters, digits and single hyphens",
		);
	}
}

function assertHasTitle(titles: Array<string | null | undefined>) {
	if (!titles.some((title) => (title ?? "").trim().length > 0)) {
		throw AnimeErrors.error("anime-invalid").withMessage(
			"At least one title (title_ua, title_en or title_original) is required",
		);
	}
}

const uniqueGenres = (genres: GenreType[] | undefined): GenreType[] => [
	...new Set(genres ?? []),
];

export async function listAnimes(
	db: Pool,
	query: AnimeListQueryType,
): Promise<AnimeListResponseType> {
	const page = query.page ?? 1;
	const limit = query.limit ?? 20;
	const filter: AnimeListFilterType = {
		genre: query.genre ?? null,
		status: query.status ?? null,
		format: query.format ?? null,
		year: query.year ?? null,
		available: query.available ?? true,
		sort: query.sort ?? "newest",
		limit,
		offset: (page - 1) * limit,
	};

	const { items, total } = await repoListAnimes(db, filter)
		.catch(handleDbError);

	return {
		items: items.map(toAnime),
		pagination: {
			page,
			limit,
			total,
			total_pages: total === 0 ? 0 : Math.ceil(total / limit),
		},
	};
}

export async function getAnime(db: Pool, animeId: string): Promise<AnimeResponseType> {
	assertValidId(animeId);

	const anime = await repoGetAnimeById(db, animeId).catch(handleDbError);
	if (!anime) throw AnimeErrors.error("anime-not-found");

	return toAnime(anime);
}

export async function getAnimeBySlug(db: Pool, slug: string): Promise<AnimeResponseType> {
	assertValidSlug(slug);

	const anime = await repoGetAnimeBySlug(db, slug).catch(handleDbError);
	if (!anime) throw AnimeErrors.error("anime-not-found");

	return toAnime(anime);
}

export async function createAnime(
	db: Pool,
	data: CreateAnimeBodyType,
): Promise<AnimeResponseType> {
	assertValidSlug(data.slug);
	assertHasTitle([data.titleUa, data.titleEn, data.titleOriginal]);

	const anime = await repoCreateAnime(db, {
			slug: data.slug,
			titleUa: data.titleUa ?? "",
			titleEn: data.titleEn ?? "",
			titleOriginal: data.titleOriginal ?? "",
			animeDescription: data.animeDescription ?? "",
			coverUrl: data.coverUrl ?? "",
			productionStudio: data.productionStudio ?? "",
			malId: data.malId ?? null,
			anilistId: data.anilistId ?? null,
			hikkaId: data.hikkaId ?? null,
			imdbId: data.imdbId ?? null,
			yearReleased: data.yearReleased ?? null,
			avgEpisodeDuration: data.avgEpisodeDuration ?? 0,
			episodesCount: data.episodesCount ?? 0,
			ageRestriction: data.ageRestriction ?? null,
			animeStatus: data.animeStatus ?? null,
			animeFormat: data.animeFormat ?? "tv",
			available: data.available ?? true,
			genres: uniqueGenres(data.genres),
		})
		.catch(handleDbError);

	if (!anime) throw AnimeErrors.error("anime-not-created");

	return toAnime(anime);
}

export async function updateAnime(
	db: Pool,
	animeId: string,
	data: UpdateAnimeBodyType,
): Promise<AnimeResponseType> {
	assertValidId(animeId);

	if (!data || Object.keys(data).length === 0) {
		throw AnimeErrors.error("anime-invalid").withMessage("Update payload cannot be empty");
	}
	if (data.slug !== undefined) assertValidSlug(data.slug);

	const existing = await repoGetAnimeById(db, animeId)
		.catch(handleDbError);
	if (!existing) throw AnimeErrors.error("anime-not-found");

	assertHasTitle([
		data.titleUa ?? existing.titleUa,
		data.titleEn ?? existing.titleEn,
		data.titleOriginal ?? existing.titleOriginal,
	]);

	const patch: UpdateAnimeRecord = {};

	if (data.slug !== undefined) patch.slug = data.slug;
	if (data.titleUa !== undefined) patch.titleUa = data.titleUa;
	if (data.titleEn !== undefined) patch.titleEn = data.titleEn;
	if (data.titleOriginal !== undefined) {
		patch.titleOriginal = data.titleOriginal;
	}
	if (data.animeDescription !== undefined) {
		patch.animeDescription = data.animeDescription;
	}
	if (data.coverUrl !== undefined) patch.coverUrl = data.coverUrl ?? "";
	if (data.productionStudio !== undefined) {
		patch.productionStudio = data.productionStudio;
	}
	if (data.malId !== undefined) patch.malId = data.malId;
	if (data.anilistId !== undefined) patch.anilistId = data.anilistId;
	if (data.hikkaId !== undefined) patch.hikkaId = data.hikkaId;
	if (data.imdbId !== undefined) patch.imdbId = data.imdbId;
	if (data.yearReleased !== undefined) {
		patch.yearReleased = data.yearReleased;
	}
	if (data.avgEpisodeDuration !== undefined) {
		patch.avgEpisodeDuration = data.avgEpisodeDuration;
	}
	if (data.episodesCount !== undefined) {
		patch.episodesCount = data.episodesCount;
	}
	if (data.ageRestriction !== undefined) {
		patch.ageRestriction = data.ageRestriction;
	}
	if (data.animeStatus !== undefined) patch.animeStatus = data.animeStatus;
	if (data.animeFormat !== undefined) patch.animeFormat = data.animeFormat;
	if (data.available !== undefined) patch.available = data.available;
	if (data.genres !== undefined) patch.genres = uniqueGenres(data.genres);

	const anime = await repoUpdateAnime(db, animeId, patch)
		.catch(handleDbError);
	if (!anime) throw AnimeErrors.error("anime-not-found");

	return toAnime(anime);
}

export async function deleteAnime(db: Pool, animeId: string): Promise<void> {
	assertValidId(animeId);

	const deleted = await repoDeleteAnime(db, animeId).catch(handleDbError);
	if (!deleted) throw AnimeErrors.error("anime-not-found");
}

export async function getAnimesCountByStatus(db: Pool) {
	return countAnimesByStatusQuery(db).catch(handleDbError);
}

export async function getStudioStats(db: Pool) {
	return getStudioStatsQuery(db).catch(handleDbError);
}

export async function getFormatStats(db: Pool) {
	return getFormatStatsQuery(db).catch(handleDbError);
}

export async function getStudiosAboveAverage(db: Pool) {
	return getStudiosAboveAverageEpisodes(db).catch(handleDbError);
}

export async function getAnimesAboveAverageEpisodes(db: Pool) {
	return getOngoingAnimes(db).catch(handleDbError);
}

export async function getAnimesWithMaxEpisodes(db: Pool) {
	return getAvailableAnimesByCurrentYear(db).catch(handleDbError);
}


export type AnimeRecord = NonNullable<
	Awaited<ReturnType<typeof getAnimeById>>
>;

export interface CreateAnimeRecord {
	slug: string;
	titleUa: string;
	titleEn: string;
	titleOriginal: string;
	animeDescription: string;
	coverUrl: string;
	productionStudio: string;
	malId: number | null;
	anilistId: number | null;
	hikkaId: string | null;
	imdbId: string | null;
	yearReleased: number | null;
	avgEpisodeDuration: number;
	episodesCount: number;
	ageRestriction: string | null;
	animeStatus: string | null;
	animeFormat: string;
	available: boolean;
	genres: GenreType[];
}

export type UpdateAnimeRecord = Partial<Omit<CreateAnimeRecord, "genres">> & {
	genres?: GenreType[];
};

async function withTransaction<T>(
	db: Pool,
	callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
	const client = await db.connect();
	try {
		await client.query("BEGIN");
		const result = await callback(client);
		await client.query("COMMIT");
		return result;
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
}

async function repoListAnimes(db: Pool, filter: AnimeListFilterType) {
	const filters = {
		genre: filter.genre,
		status: filter.status,
		format: filter.format,
		year: filter.year,
		available: filter.available,
	};
	const [items, counted] = await Promise.all([
		listAnimeRows(db, {
			...filters,
			sort: filter.sort,
			limit: filter.limit,
			offset: filter.offset,
		}),
		countAnimes(db, filters),
	]);
	return {
		items,
		total: counted?.total ?? 0,
	};
}

async function repoGetAnimeById(
	db: Pool,
	animeId: string,
): Promise<AnimeRecord | null> {
	return getAnimeById(db, { animeId });
}

async function repoGetAnimeBySlug(
	db: Pool,
	slug: string,
): Promise<AnimeRecord | null> {
	return getAnimeBySlugQuery(db, { slug });
}

async function repoCreateAnime(
	db: Pool,
	input: CreateAnimeRecord,
): Promise<AnimeRecord | null> {
	return withTransaction(db, async (client) => {
		const inserted = await createAnimeQuery(client, {
			slug: input.slug,
			titleUa: input.titleUa,
			titleEn: input.titleEn,
			titleOriginal: input.titleOriginal,
			animeDescription: input.animeDescription,
			coverUrl: input.coverUrl,
			productionStudio: input.productionStudio,
			malId: input.malId === null ? null : String(input.malId),
			anilistId: input.anilistId === null ? null : String(input.anilistId),
			hikkaId: input.hikkaId,
			imdbId: input.imdbId,
			yearReleased: input.yearReleased,
			avgEpisodeDuration: input.avgEpisodeDuration,
			episodesCount: input.episodesCount,
			ageRestriction: input.ageRestriction,
			animeStatus: input.animeStatus,
			animeFormat: input.animeFormat,
			available: input.available,
		});
		if (!inserted) return null;
		if (input.genres.length > 0) {
			await createAnimeGenres(client, {
				animeId: inserted.animeId,
				genres: input.genres,
			});
		}
		return getAnimeById(client, { animeId: inserted.animeId });
	});
}

async function repoUpdateAnime(
	db: Pool,
	animeId: string,
	patch: UpdateAnimeRecord,
): Promise<AnimeRecord | null> {
	return withTransaction(db, async (client) => {
		const existing = await getAnimeById(client, { animeId });
		if (!existing) return null;
		const { genres, ...patchData } = patch;
		const camelToSnake: Record<string, string> = {
			titleUa: "title_ua",
			titleEn: "title_en",
			titleOriginal: "title_original",
			animeDescription: "anime_description",
			coverUrl: "cover_url",
			productionStudio: "production_studio",
			malId: "mal_id",
			anilistId: "anilist_id",
			hikkaId: "hikka_id",
			imdbId: "imdb_id",
			yearReleased: "year_released",
			avgEpisodeDuration: "avg_episode_duration",
			episodesCount: "episodes_count",
			ageRestriction: "age_restriction",
			animeStatus: "anime_status",
			animeFormat: "anime_format",
		};
		const snakePatchData: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(patchData)) {
			snakePatchData[camelToSnake[key] ?? key] = value;
		}
		// updateAnimeById requires full row; merge with existing
		const merged = { ...existing, ...patch };
		const updated = await updateAnimeById(client, {
			slug: merged.slug ?? existing.slug,
			titleUa: merged.titleUa ?? existing.titleUa,
			titleEn: merged.titleEn ?? existing.titleEn,
			titleOriginal: merged.titleOriginal ?? existing.titleOriginal,
			animeDescription: merged.animeDescription ?? existing.animeDescription,
			coverUrl: merged.coverUrl ?? existing.coverUrl,
			productionStudio: merged.productionStudio ?? existing.productionStudio,
			malId: merged.malId === undefined ? existing.malId : (merged.malId === null ? null : String(merged.malId)),
			anilistId: merged.anilistId === undefined ? existing.anilistId : (merged.anilistId === null ? null : String(merged.anilistId)),
			hikkaId: merged.hikkaId === undefined ? existing.hikkaId : (merged.hikkaId === null ? null : merged.hikkaId),
			imdbId: merged.imdbId ?? existing.imdbId,
			yearReleased: merged.yearReleased ?? existing.yearReleased,
			avgEpisodeDuration: merged.avgEpisodeDuration ?? existing.avgEpisodeDuration,
			episodesCount: merged.episodesCount ?? existing.episodesCount,
			ageRestriction: merged.ageRestriction ?? existing.ageRestriction,
			animeStatus: merged.animeStatus ?? existing.animeStatus,
			animeFormat: merged.animeFormat ?? existing.animeFormat,
			available: merged.available ?? existing.available,
			animeId,
		});
		if (!updated) return null;
		if (genres !== undefined) {
			await client.query("DELETE FROM genres WHERE anime_id = $1", [animeId]);
			if (genres.length > 0) {
				await createAnimeGenres(client, { animeId, genres });
			}
		}
		return getAnimeById(client, { animeId });
	});
}

async function repoDeleteAnime(db: Pool, animeId: string): Promise<boolean> {
	const result = await db.query("DELETE FROM animes WHERE anime_id = $1 RETURNING anime_id", [animeId]);
	return (result.rowCount ?? 0) > 0;
}