import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createAnimeQuery = `-- name: CreateAnime :one
INSERT INTO public.animes (
    slug,
    title_ua,
    title_en,
    title_original,
    anime_description,
    cover_url,
    production_studio,
    mal_id,
    anilist_id,
    hikka_id,
    imdb_id,
    year_released,
    avg_episode_duration,
    episodes_count,
    age_restriction,
    anime_status,
    anime_format,
    available
) VALUES (
    $1::text,
    $2::text,
    $3::text,
    $4::text,
    $5::text,
    $6::text,
    $7::text,
    $8::bigint,
    $9::bigint,
    $10::text,
    $11::text,
    $12::smallint,
    $13::smallint,
    $14::smallint,
    $15::mpaa_rating_enum,
    $16::anime_status_enum,
    $17::anime_format_enum,
    $18::boolean
)
RETURNING anime_id`;

export interface CreateAnimeArgs {
    slug: string;
    titleUa: string;
    titleEn: string;
    titleOriginal: string;
    animeDescription: string;
    coverUrl: string;
    productionStudio: string;
    malId: string | null;
    anilistId: string | null;
    hikkaId: string | null;
    imdbId: string | null;
    yearReleased: number | null;
    avgEpisodeDuration: number;
    episodesCount: number;
    ageRestriction: string | null;
    animeStatus: string | null;
    animeFormat: string;
    available: boolean;
}

export interface CreateAnimeRow {
    animeId: string;
}

export async function createAnime(client: Client, args: CreateAnimeArgs): Promise<CreateAnimeRow | null> {
    const result = await client.query({
        text: createAnimeQuery,
        values: [args.slug, args.titleUa, args.titleEn, args.titleOriginal, args.animeDescription, args.coverUrl, args.productionStudio, args.malId, args.anilistId, args.hikkaId, args.imdbId, args.yearReleased, args.avgEpisodeDuration, args.episodesCount, args.ageRestriction, args.animeStatus, args.animeFormat, args.available],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        animeId: row[0]
    };
}

export const createAnimeGenresQuery = `-- name: CreateAnimeGenres :exec

INSERT INTO public.genres (anime_id, genre_type)
SELECT $1::uuid, g
FROM unnest($2::genre_type_enum[]) AS g
ON CONFLICT DO NOTHING`;

export interface CreateAnimeGenresArgs {
    animeId: string;
    genres: string[];
}

export async function createAnimeGenres(client: Client, args: CreateAnimeGenresArgs): Promise<void> {
    await client.query({
        text: createAnimeGenresQuery,
        values: [args.animeId, args.genres],
        rowMode: "array"
    });
}

export const listAnimesQuery = `-- name: ListAnimes :many
SELECT
    a.anime_id,
    a.slug,
    a.title_ua,
    a.title_en,
    a.title_original,
    a.anime_description,
    a.cover_url,
    a.production_studio,
    a.mal_id,
    a.anilist_id,
    a.hikka_id,
    a.imdb_id,
    a.year_released,
    a.avg_episode_duration,
    a.episodes_count,
    a.age_restriction,
    a.anime_status,
    a.anime_format,
    a.available,
    ARRAY(
        SELECT g.genre_type
        FROM public.genres g
        WHERE g.anime_id = a.anime_id
        ORDER BY g.genre_type
    )::text[] AS genres
FROM public.animes a
WHERE
    ($1::text IS NULL OR
        a.slug ILIKE '%' || $1::text || '%' OR
        a.title_ua ILIKE '%' || $1::text || '%' OR
        a.title_en ILIKE '%' || $1::text || '%' OR
        a.title_original ILIKE '%' || $1::text || '%')
    AND ($2::genre_type_enum IS NULL OR EXISTS (
        SELECT 1
        FROM public.genres fg
        WHERE fg.anime_id = a.anime_id
          AND fg.genre_type = $2::genre_type_enum
    ))
    AND ($3::anime_status_enum IS NULL OR a.anime_status = $3::anime_status_enum)
    AND ($4::anime_format_enum IS NULL OR a.anime_format = $4::anime_format_enum)
    AND ($5::smallint IS NULL OR a.year_released = $5::smallint)
    AND ($6::boolean IS NULL OR a.available = $6::boolean)
ORDER BY
    CASE WHEN $7::text = 'oldest' THEN a.anime_id END ASC,
    CASE WHEN $7::text = 'title' THEN lower(a.title_ua) END ASC,
    CASE WHEN $7::text = 'year_desc' THEN a.year_released END DESC NULLS LAST,
    CASE WHEN $7::text = 'year_asc' THEN a.year_released END ASC NULLS LAST,
    a.anime_id DESC
LIMIT $9::int OFFSET $8::int`;

export interface ListAnimesArgs {
    search: string | null;
    genre: string | null;
    status: string | null;
    format: string | null;
    year: number | null;
    available: boolean | null;
    sort: string;
    offset: number;
    limit: number;
}

export interface ListAnimesRow {
    animeId: string;
    slug: string;
    titleUa: string;
    titleEn: string;
    titleOriginal: string;
    animeDescription: string;
    coverUrl: string;
    productionStudio: string;
    malId: string | null;
    anilistId: string | null;
    hikkaId: string | null;
    imdbId: string | null;
    yearReleased: number | null;
    avgEpisodeDuration: number;
    episodesCount: number;
    ageRestriction: string | null;
    animeStatus: string | null;
    animeFormat: string;
    available: boolean;
    genres: string[];
}

export async function listAnimes(client: Client, args: ListAnimesArgs): Promise<ListAnimesRow[]> {
    const result = await client.query({
        text: listAnimesQuery,
        values: [args.search, args.genre, args.status, args.format, args.year, args.available, args.sort, args.offset, args.limit],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            animeId: row[0],
            slug: row[1],
            titleUa: row[2],
            titleEn: row[3],
            titleOriginal: row[4],
            animeDescription: row[5],
            coverUrl: row[6],
            productionStudio: row[7],
            malId: row[8],
            anilistId: row[9],
            hikkaId: row[10],
            imdbId: row[11],
            yearReleased: row[12],
            avgEpisodeDuration: row[13],
            episodesCount: row[14],
            ageRestriction: row[15],
            animeStatus: row[16],
            animeFormat: row[17],
            available: row[18],
            genres: row[19]
        };
    });
}

export const countAnimesQuery = `-- name: CountAnimes :one
SELECT COUNT(*)::int AS total
FROM public.animes a
WHERE
    ($1::text IS NULL OR
        a.slug ILIKE '%' || $1::text || '%' OR
        a.title_ua ILIKE '%' || $1::text || '%' OR
        a.title_en ILIKE '%' || $1::text || '%' OR
        a.title_original ILIKE '%' || $1::text || '%')
    AND ($2::genre_type_enum IS NULL OR EXISTS (
        SELECT 1
        FROM public.genres fg
        WHERE fg.anime_id = a.anime_id
          AND fg.genre_type = $2::genre_type_enum
    ))
    AND ($3::anime_status_enum IS NULL OR a.anime_status = $3::anime_status_enum)
    AND ($4::anime_format_enum IS NULL OR a.anime_format = $4::anime_format_enum)
    AND ($5::smallint IS NULL OR a.year_released = $5::smallint)
    AND ($6::boolean IS NULL OR a.available = $6::boolean)`;

export interface CountAnimesArgs {
    search: string | null;
    genre: string | null;
    status: string | null;
    format: string | null;
    year: number | null;
    available: boolean | null;
}

export interface CountAnimesRow {
    total: number;
}

export async function countAnimes(client: Client, args: CountAnimesArgs): Promise<CountAnimesRow | null> {
    const result = await client.query({
        text: countAnimesQuery,
        values: [args.search, args.genre, args.status, args.format, args.year, args.available],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        total: row[0]
    };
}

export const getAnimeByIdQuery = `-- name: GetAnimeById :one
SELECT
    a.anime_id,
    a.slug,
    a.title_ua,
    a.title_en,
    a.title_original,
    a.anime_description,
    a.cover_url,
    a.production_studio,
    a.mal_id,
    a.anilist_id,
    a.hikka_id,
    a.imdb_id,
    a.year_released,
    a.avg_episode_duration,
    a.episodes_count,
    a.age_restriction,
    a.anime_status,
    a.anime_format,
    a.available,
    ARRAY(
        SELECT g.genre_type
        FROM public.genres g
        WHERE g.anime_id = a.anime_id
        ORDER BY g.genre_type
    )::text[] AS genres
FROM public.animes a
WHERE a.anime_id = $1::uuid`;

export interface GetAnimeByIdArgs {
    animeId: string;
}

export interface GetAnimeByIdRow {
    animeId: string;
    slug: string;
    titleUa: string;
    titleEn: string;
    titleOriginal: string;
    animeDescription: string;
    coverUrl: string;
    productionStudio: string;
    malId: string | null;
    anilistId: string | null;
    hikkaId: string | null;
    imdbId: string | null;
    yearReleased: number | null;
    avgEpisodeDuration: number;
    episodesCount: number;
    ageRestriction: string | null;
    animeStatus: string | null;
    animeFormat: string;
    available: boolean;
    genres: string[];
}

export async function getAnimeById(client: Client, args: GetAnimeByIdArgs): Promise<GetAnimeByIdRow | null> {
    const result = await client.query({
        text: getAnimeByIdQuery,
        values: [args.animeId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        animeId: row[0],
        slug: row[1],
        titleUa: row[2],
        titleEn: row[3],
        titleOriginal: row[4],
        animeDescription: row[5],
        coverUrl: row[6],
        productionStudio: row[7],
        malId: row[8],
        anilistId: row[9],
        hikkaId: row[10],
        imdbId: row[11],
        yearReleased: row[12],
        avgEpisodeDuration: row[13],
        episodesCount: row[14],
        ageRestriction: row[15],
        animeStatus: row[16],
        animeFormat: row[17],
        available: row[18],
        genres: row[19]
    };
}

export const getAnimeBySlugQuery = `-- name: GetAnimeBySlug :one
SELECT
    a.anime_id,
    a.slug,
    a.title_ua,
    a.title_en,
    a.title_original,
    a.anime_description,
    a.cover_url,
    a.production_studio,
    a.mal_id,
    a.anilist_id,
    a.hikka_id,
    a.imdb_id,
    a.year_released,
    a.avg_episode_duration,
    a.episodes_count,
    a.age_restriction,
    a.anime_status,
    a.anime_format,
    a.available,
    ARRAY(
        SELECT g.genre_type
        FROM public.genres g
        WHERE g.anime_id = a.anime_id
        ORDER BY g.genre_type
    )::text[] AS genres
FROM public.animes a
WHERE a.slug = $1::text`;

export interface GetAnimeBySlugArgs {
    slug: string;
}

export interface GetAnimeBySlugRow {
    animeId: string;
    slug: string;
    titleUa: string;
    titleEn: string;
    titleOriginal: string;
    animeDescription: string;
    coverUrl: string;
    productionStudio: string;
    malId: string | null;
    anilistId: string | null;
    hikkaId: string | null;
    imdbId: string | null;
    yearReleased: number | null;
    avgEpisodeDuration: number;
    episodesCount: number;
    ageRestriction: string | null;
    animeStatus: string | null;
    animeFormat: string;
    available: boolean;
    genres: string[];
}

export async function getAnimeBySlug(client: Client, args: GetAnimeBySlugArgs): Promise<GetAnimeBySlugRow | null> {
    const result = await client.query({
        text: getAnimeBySlugQuery,
        values: [args.slug],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        animeId: row[0],
        slug: row[1],
        titleUa: row[2],
        titleEn: row[3],
        titleOriginal: row[4],
        animeDescription: row[5],
        coverUrl: row[6],
        productionStudio: row[7],
        malId: row[8],
        anilistId: row[9],
        hikkaId: row[10],
        imdbId: row[11],
        yearReleased: row[12],
        avgEpisodeDuration: row[13],
        episodesCount: row[14],
        ageRestriction: row[15],
        animeStatus: row[16],
        animeFormat: row[17],
        available: row[18],
        genres: row[19]
    };
}

export const countAnimesByStatusQuery = `-- name: CountAnimesByStatus :many
SELECT
    a.anime_status,
    COUNT(*)::int AS total
FROM public.animes a
WHERE a.available = TRUE
  AND a.anime_status IS NOT NULL
GROUP BY a.anime_status
ORDER BY total DESC`;

export interface CountAnimesByStatusRow {
    animeStatus: string | null;
    total: number;
}

export async function countAnimesByStatus(client: Client): Promise<CountAnimesByStatusRow[]> {
    const result = await client.query({
        text: countAnimesByStatusQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            animeStatus: row[0],
            total: row[1]
        };
    });
}

export const getStudioStatsQuery = `-- name: GetStudioStats :many
SELECT
    a.production_studio AS studio,
    COUNT(*)::int AS titles_count,
    COALESCE(SUM(a.episodes_count), 0)::int AS total_episodes,
    ROUND(AVG(NULLIF(a.avg_episode_duration, 0))::numeric, 1)::float8 AS avg_episode_duration
FROM public.animes a
WHERE a.production_studio <> ''
GROUP BY a.production_studio
ORDER BY total_episodes DESC, a.production_studio`;

export interface GetStudioStatsRow {
    studio: string;
    titlesCount: number;
    totalEpisodes: number;
    avgEpisodeDuration: number;
}

export async function getStudioStats(client: Client): Promise<GetStudioStatsRow[]> {
    const result = await client.query({
        text: getStudioStatsQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            studio: row[0],
            titlesCount: row[1],
            totalEpisodes: row[2],
            avgEpisodeDuration: row[3]
        };
    });
}

export const getFormatStatsQuery = `-- name: GetFormatStats :many
SELECT
    a.anime_format,
    COUNT(*)::int AS titles_count,
    ROUND(AVG(a.episodes_count)::numeric, 1)::float8 AS avg_episodes,
    MAX(a.episodes_count)::int AS max_episodes,
    MIN(a.episodes_count)::int AS min_episodes
FROM public.animes a
GROUP BY a.anime_format
ORDER BY titles_count DESC`;

export interface GetFormatStatsRow {
    animeFormat: string;
    titlesCount: number;
    avgEpisodes: number;
    maxEpisodes: number;
    minEpisodes: number;
}

export async function getFormatStats(client: Client): Promise<GetFormatStatsRow[]> {
    const result = await client.query({
        text: getFormatStatsQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            animeFormat: row[0],
            titlesCount: row[1],
            avgEpisodes: row[2],
            maxEpisodes: row[3],
            minEpisodes: row[4]
        };
    });
}

export const getStudiosAboveAverageEpisodesQuery = `-- name: GetStudiosAboveAverageEpisodes :many
SELECT
    a.production_studio AS studio,
    ROUND(AVG(a.episodes_count)::numeric, 1)::float8 AS avg_episodes
FROM public.animes a
WHERE a.production_studio <> ''
GROUP BY a.production_studio
HAVING AVG(a.episodes_count) > (
    SELECT AVG(episodes_count)
    FROM public.animes
    WHERE episodes_count > 0
)
ORDER BY avg_episodes DESC`;

export interface GetStudiosAboveAverageEpisodesRow {
    studio: string;
    avgEpisodes: number;
}

export async function getStudiosAboveAverageEpisodes(client: Client): Promise<GetStudiosAboveAverageEpisodesRow[]> {
    const result = await client.query({
        text: getStudiosAboveAverageEpisodesQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            studio: row[0],
            avgEpisodes: row[1]
        };
    });
}

export const getOngoingAnimesQuery = `-- name: GetOngoingAnimes :many
SELECT
    a.anime_id,
    a.slug,
    a.title_ua,
    a.title_en,
    a.episodes_count
FROM public.animes a
WHERE a.anime_status = 'ongoing'::anime_status_enum
ORDER BY a.episodes_count DESC, a.title_ua`;

export interface GetOngoingAnimesRow {
    animeId: string;
    slug: string;
    titleUa: string;
    titleEn: string;
    episodesCount: number;
}

export async function getOngoingAnimes(client: Client): Promise<GetOngoingAnimesRow[]> {
    const result = await client.query({
        text: getOngoingAnimesQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            animeId: row[0],
            slug: row[1],
            titleUa: row[2],
            titleEn: row[3],
            episodesCount: row[4]
        };
    });
}

export const getAvailableAnimesByCurrentYearQuery = `-- name: GetAvailableAnimesByCurrentYear :many
SELECT
    "anime_id",
    "slug",
    "title_ua",
    "year_released",
    "cover_url",
    "episodes_count"
FROM public.animes
WHERE
    "available" = TRUE
    AND "year_released" = EXTRACT(YEAR FROM NOW()::date)::smallint
ORDER BY "year_released" DESC`;

export interface GetAvailableAnimesByCurrentYearRow {
    animeId: string;
    slug: string;
    titleUa: string;
    yearReleased: number | null;
    coverUrl: string;
    episodesCount: number;
}

export async function getAvailableAnimesByCurrentYear(client: Client): Promise<GetAvailableAnimesByCurrentYearRow[]> {
    const result = await client.query({
        text: getAvailableAnimesByCurrentYearQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            animeId: row[0],
            slug: row[1],
            titleUa: row[2],
            yearReleased: row[3],
            coverUrl: row[4],
            episodesCount: row[5]
        };
    });
}

export const updateAnimeByIdQuery = `-- name: UpdateAnimeById :one
UPDATE public.animes
SET
    "slug"                 = COALESCE($1::text, slug),
    "title_ua"             = COALESCE($2::text, title_ua),
    "title_en"             = COALESCE($3::text, title_en),
    "title_original"       = COALESCE($4::text, title_original),
    "anime_description"    = COALESCE($5::text, anime_description),
    "cover_url"            = COALESCE($6::text, cover_url),
    "production_studio"    = COALESCE($7::text, production_studio),
    "mal_id"               = $8::bigint,
    "anilist_id"           = $9::bigint,
    "hikka_id"             = $10::text,
    "imdb_id"              = $11::text,
    "year_released"        = COALESCE($12::smallint, year_released),
    "avg_episode_duration" = COALESCE($13::smallint, avg_episode_duration),
    "episodes_count"       = COALESCE($14::smallint, episodes_count),
    "age_restriction"      = COALESCE($15::mpaa_rating_enum, age_restriction),
    "anime_status"         = COALESCE($16::anime_status_enum, anime_status),
    "anime_format"         = COALESCE($17::anime_format_enum, anime_format),
    "available"            = COALESCE($18::boolean, available),
    "updated_at"           = NOW()
WHERE "anime_id" = $19::uuid
RETURNING
    "anime_id",
    "slug",
    "title_ua",
    "title_en",
    "title_original",
    "anime_description",
    "cover_url",
    "production_studio",
    "mal_id",
    "anilist_id",
    "hikka_id",
    "imdb_id",
    "year_released",
    "avg_episode_duration",
    "episodes_count",
    "age_restriction",
    "anime_status",
    "anime_format",
    "available"`;

export interface UpdateAnimeByIdArgs {
    slug: string;
    titleUa: string;
    titleEn: string | null;
    titleOriginal: string | null;
    animeDescription: string | null;
    coverUrl: string | null;
    productionStudio: string | null;
    malId: string | null;
    anilistId: string | null;
    hikkaId: string | null;
    imdbId: string | null;
    yearReleased: number | null;
    avgEpisodeDuration: number | null;
    episodesCount: number | null;
    ageRestriction: string | null;
    animeStatus: string | null;
    animeFormat: string;
    available: boolean;
    animeId: string;
}

export interface UpdateAnimeByIdRow {
    animeId: string;
    slug: string;
    titleUa: string;
    titleEn: string;
    titleOriginal: string;
    animeDescription: string;
    coverUrl: string;
    productionStudio: string;
    malId: string | null;
    anilistId: string | null;
    hikkaId: string | null;
    imdbId: string | null;
    yearReleased: number | null;
    avgEpisodeDuration: number;
    episodesCount: number;
    ageRestriction: string | null;
    animeStatus: string | null;
    animeFormat: string;
    available: boolean;
}

export async function updateAnimeById(client: Client, args: UpdateAnimeByIdArgs): Promise<UpdateAnimeByIdRow | null> {
    const result = await client.query({
        text: updateAnimeByIdQuery,
        values: [args.slug, args.titleUa, args.titleEn, args.titleOriginal, args.animeDescription, args.coverUrl, args.productionStudio, args.malId, args.anilistId, args.hikkaId, args.imdbId, args.yearReleased, args.avgEpisodeDuration, args.episodesCount, args.ageRestriction, args.animeStatus, args.animeFormat, args.available, args.animeId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        animeId: row[0],
        slug: row[1],
        titleUa: row[2],
        titleEn: row[3],
        titleOriginal: row[4],
        animeDescription: row[5],
        coverUrl: row[6],
        productionStudio: row[7],
        malId: row[8],
        anilistId: row[9],
        hikkaId: row[10],
        imdbId: row[11],
        yearReleased: row[12],
        avgEpisodeDuration: row[13],
        episodesCount: row[14],
        ageRestriction: row[15],
        animeStatus: row[16],
        animeFormat: row[17],
        available: row[18]
    };
}

export const updateAnimeStatusByIdQuery = `-- name: UpdateAnimeStatusById :one
UPDATE public.animes
SET
    "anime_status" = $1::anime_status_enum,
    "updated_at"   = NOW()
WHERE "anime_id" = $2::uuid
RETURNING "anime_id",
          "anime_status"`;

export interface UpdateAnimeStatusByIdArgs {
    animeStatus: string;
    animeId: string;
}

export interface UpdateAnimeStatusByIdRow {
    animeId: string;
    animeStatus: string | null;
}

export async function updateAnimeStatusById(client: Client, args: UpdateAnimeStatusByIdArgs): Promise<UpdateAnimeStatusByIdRow | null> {
    const result = await client.query({
        text: updateAnimeStatusByIdQuery,
        values: [args.animeStatus, args.animeId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        animeId: row[0],
        animeStatus: row[1]
    };
}

export const updateAnimeAvailableByIdQuery = `-- name: UpdateAnimeAvailableById :one
UPDATE public.animes
SET
    "available"  = $1::boolean,
    "updated_at" = NOW()
WHERE "anime_id" = $2::uuid
RETURNING "anime_id",
          "available"`;

export interface UpdateAnimeAvailableByIdArgs {
    available: boolean;
    animeId: string;
}

export interface UpdateAnimeAvailableByIdRow {
    animeId: string;
    available: boolean;
}

export async function updateAnimeAvailableById(client: Client, args: UpdateAnimeAvailableByIdArgs): Promise<UpdateAnimeAvailableByIdRow | null> {
    const result = await client.query({
        text: updateAnimeAvailableByIdQuery,
        values: [args.available, args.animeId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        animeId: row[0],
        available: row[1]
    };
}

export const incrementAnimeEpisodesByIdQuery = `-- name: IncrementAnimeEpisodesById :one
UPDATE public.animes
SET
    "episodes_count" = GREATEST(episodes_count, $1::smallint),
    "updated_at"     = NOW()
WHERE "anime_id" = $2::uuid
RETURNING "anime_id",
          "episodes_count"`;

export interface IncrementAnimeEpisodesByIdArgs {
    episodesCount: number;
    animeId: string;
}

export interface IncrementAnimeEpisodesByIdRow {
    animeId: string;
    episodesCount: number;
}

export async function incrementAnimeEpisodesById(client: Client, args: IncrementAnimeEpisodesByIdArgs): Promise<IncrementAnimeEpisodesByIdRow | null> {
    const result = await client.query({
        text: incrementAnimeEpisodesByIdQuery,
        values: [args.episodesCount, args.animeId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        animeId: row[0],
        episodesCount: row[1]
    };
}

