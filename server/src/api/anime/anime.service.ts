import type { Pool, PoolClient } from "pg";
import type {
	AnimeResponseType,
	AnimeType,
	AnimeListFilterType,
	ListAnimesRequestQueriesType,
	AnimeListResponseType,
	AnimeListType,
	CreateAnimeRequestPayloadType,
	GenreType,
	UpdateAnimeRequestPayloadType,
} from "./anime.dto";
import { AnimeErrors } from "./anime.errors";
import { toAnimeModel, toCoverUrl } from "./anime.model";
import {
	countAnimes,
	createAnime as createAnimeQuery,
	createAnimeGenres,
	listAnimes as listAnimeRows,
	updateAnimeById,
	updateAnimeAvailableById,
	deleteAnimeGenres,
	getAnimeById,
	getAnimeBySlug as getAnimeBySlugQuery,
	countAnimesByStatus as countAnimesByStatusQuery,
	getFormatStats as getFormatStatsQuery,
	getStudioStats as getStudioStatsQuery,
	getStudiosAboveAverageEpisodes,
	getOngoingAnimes,
	getAvailableAnimesByCurrentYear,
} from "@sqlc/animes_sql";
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
			throw AnimeErrors.error("anime-already-exists").withMessage("anime with this slug already exists");
		}
		if (detail.includes("mal_id")) {
			throw AnimeErrors.error("anime-already-exists").withMessage(
				"anime with this MAL ID already exists",
			);
		}
		if (detail.includes("anilist_id")) {
			throw AnimeErrors.error("anime-already-exists").withMessage(
				"anime with this AniList ID already exists",
			);
		}
		if (detail.includes("hikka_id")) {
			throw AnimeErrors.error("anime-already-exists").withMessage(
				"anime with this Hikka ID already exists",
			);
		}
		if (detail.includes("imdb_id")) {
			throw AnimeErrors.error("anime-already-exists").withMessage(
				"anime with this IMDb ID already exists",
			);
		}

		throw AnimeErrors.error("anime-already-exists").withMessage(
			"anime with the same unique fields already exists",
		);
	}

	if (dbError.code === "22P02") {
		throw AnimeErrors.error("anime-invalid").withMessage("invalid data format or enum value");
	}
	if (dbError.code === "22001") {
		throw AnimeErrors.error("anime-invalid").withMessage("field value exceeds maximum allowed length");
	}
	if (dbError.code === "23514") {
		throw AnimeErrors.error("anime-invalid").withMessage("value violates a database constraint");
	}
	if (dbError.code === "23503") {
		throw AnimeErrors.error("anime-invalid").withMessage("related record does not exist");
	}
	if (dbError.code === "23502") {
		throw AnimeErrors.error("anime-invalid").withMessage("required field is missing");
	}

	throw error;
}

const uniqueGenres = (genres: GenreType[] | undefined): GenreType[] => [
	...new Set(genres ?? []),
];

const NULLABLE_ANIME_FIELDS = {
	coverId: "cover_id",
	malId: "mal_id",
	anilistId: "anilist_id",
	hikkaId: "hikka_id",
	imdbId: "imdb_id",
	yearReleased: "year_released",
	ageRestriction: "age_restriction",
	animeStatus: "anime_status",
} as const;

export async function listAnimes(
	db: Pool,
	query: ListAnimesRequestQueriesType,
): Promise<AnimeListType> {
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
		items: items.map((item) => toAnimeModel(item)),
		pagination: {
			page,
			limit,
			total,
			total_pages: total === 0 ? 0 : Math.ceil(total / limit),
		},
	};
}

export async function getAnime(db: Pool, animeId: string): Promise<AnimeType> {
	const anime = await repoGetAnimeById(db, animeId).catch(handleDbError);
	if (!anime) throw AnimeErrors.error("anime-not-found");

	return toAnimeModel(anime);
}

export async function getAnimeBySlug(db: Pool, slug: string): Promise<AnimeType> {
	const anime = await repoGetAnimeBySlug(db, slug).catch(handleDbError);
	if (!anime) throw AnimeErrors.error("anime-not-found");

	return toAnimeModel(anime);
}

export async function createAnime(
	db: Pool,
	data: CreateAnimeRequestPayloadType,
): Promise<AnimeType> {
	const anime = await repoCreateAnime(db, {
		slug: data.slug,
		titleUa: data.titleUa ?? "",
		titleEn: data.titleEn ?? "",
		titleOriginal: data.titleOriginal ?? "",
		animeDescription: data.animeDescription ?? "",
		coverId: null,
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

	return toAnimeModel(anime);
}

export async function updateAnime(
	db: Pool,
	animeId: string,
	data: UpdateAnimeRequestPayloadType,
): Promise<AnimeType> {
	const existing = await repoGetAnimeById(db, animeId)
		.catch(handleDbError);
	if (!existing) throw AnimeErrors.error("anime-not-found");

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

	return toAnimeModel(anime);
}

export async function deleteAnimeCover(db: Pool, animeId: string): Promise<void> {
	const updated = await repoUpdateAnime(db, animeId, { coverId: null })
		.catch(handleDbError);
	if (!updated) throw AnimeErrors.error("anime-not-found");
}

export async function deleteAnime(db: Pool, animeId: string): Promise<void> {
	const updated = await updateAnimeAvailableById(db, { animeId, available: false })
		.catch(handleDbError);
	if (!updated) throw AnimeErrors.error("anime-not-found");
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
	return getAvailableAnimesByCurrentYear(db)
		.then((rows) => rows.map((row) => ({
			animeId: row.animeId,
			slug: row.slug,
			titleUa: row.titleUa,
			yearReleased: row.yearReleased,
			episodesCount: row.episodesCount,
			coverUrl: toCoverUrl(row.animeId),
		})))
		.catch(handleDbError);
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
	coverId: string | null;
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
			coverId: input.coverId,
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
			coverId: "cover_id",
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

		const merged = { ...existing, ...patch };
		const nullFields = Object.entries(NULLABLE_ANIME_FIELDS)
			.filter(([key]) => patch[key as keyof UpdateAnimeRecord] === null)
			.map(([, column]) => column);
		const updated = await updateAnimeById(client, {
			slug: merged.slug ?? existing.slug,
			titleUa: merged.titleUa ?? existing.titleUa,
			titleEn: merged.titleEn ?? existing.titleEn,
			titleOriginal: merged.titleOriginal ?? existing.titleOriginal,
			animeDescription: merged.animeDescription ?? existing.animeDescription,
			nullFields,
			coverId: patch.coverId ?? null,
			productionStudio: merged.productionStudio ?? existing.productionStudio,
			malId: patch.malId === undefined || patch.malId === null ? null : String(patch.malId),
			anilistId: patch.anilistId === undefined || patch.anilistId === null ? null : String(patch.anilistId),
			hikkaId: patch.hikkaId ?? null,
			imdbId: patch.imdbId ?? null,
			yearReleased: patch.yearReleased ?? null,
			avgEpisodeDuration: merged.avgEpisodeDuration ?? existing.avgEpisodeDuration,
			episodesCount: merged.episodesCount ?? existing.episodesCount,
			ageRestriction: patch.ageRestriction ?? null,
			animeStatus: patch.animeStatus ?? null,
			animeFormat: merged.animeFormat ?? existing.animeFormat,
			available: merged.available ?? existing.available,
			animeId,
		});
		if (!updated) return null;
		if (genres !== undefined) {
			await deleteAnimeGenres(client, { animeId });
			if (genres.length > 0) {
				await createAnimeGenres(client, { animeId, genres });
			}
		}
		return getAnimeById(client, { animeId });
	});
}
