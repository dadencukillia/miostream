import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
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
    )::genre_type_enum[] AS genres
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

export const selectAnimeByIdQuery = `-- name: SelectAnimeById :one
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
    )::genre_type_enum[] AS genres
FROM public.animes a
WHERE a.anime_id = $1::uuid`;

export interface SelectAnimeByIdArgs {
    animeId: string;
}

export interface SelectAnimeByIdRow {
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

export async function selectAnimeById(client: Client, args: SelectAnimeByIdArgs): Promise<SelectAnimeByIdRow | null> {
    const result = await client.query({
        text: selectAnimeByIdQuery,
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

export const selectAnimeBySlugQuery = `-- name: SelectAnimeBySlug :one
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
    )::genre_type_enum[] AS genres
FROM public.animes a
WHERE a.slug = $1::text`;

export interface SelectAnimeBySlugArgs {
    slug: string;
}

export interface SelectAnimeBySlugRow {
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

export async function selectAnimeBySlug(client: Client, args: SelectAnimeBySlugArgs): Promise<SelectAnimeBySlugRow | null> {
    const result = await client.query({
        text: selectAnimeBySlugQuery,
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

export const insertAnimeQuery = `-- name: InsertAnime :one
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

export interface InsertAnimeArgs {
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

export interface InsertAnimeRow {
    animeId: string;
}

export async function insertAnime(client: Client, args: InsertAnimeArgs): Promise<InsertAnimeRow | null> {
    const result = await client.query({
        text: insertAnimeQuery,
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

export const patchAnimeByIdQuery = `-- name: PatchAnimeById :one
UPDATE public.animes
SET
    slug = CASE
        WHEN $1::jsonb ? 'slug' THEN $1::jsonb->>'slug'
        ELSE slug
    END,
    title_ua = CASE
        WHEN $1::jsonb ? 'title_ua' THEN $1::jsonb->>'title_ua'
        ELSE title_ua
    END,
    title_en = CASE
        WHEN $1::jsonb ? 'title_en' THEN $1::jsonb->>'title_en'
        ELSE title_en
    END,
    title_original = CASE
        WHEN $1::jsonb ? 'title_original' THEN $1::jsonb->>'title_original'
        ELSE title_original
    END,
    anime_description = CASE
        WHEN $1::jsonb ? 'anime_description' THEN $1::jsonb->>'anime_description'
        ELSE anime_description
    END,
    cover_url = CASE
        WHEN $1::jsonb ? 'cover_url' THEN $1::jsonb->>'cover_url'
        ELSE cover_url
    END,
    production_studio = CASE
        WHEN $1::jsonb ? 'production_studio' THEN $1::jsonb->>'production_studio'
        ELSE production_studio
    END,
    mal_id = CASE
        WHEN $1::jsonb ? 'mal_id' THEN ($1::jsonb->>'mal_id')::bigint
        ELSE mal_id
    END,
    anilist_id = CASE
        WHEN $1::jsonb ? 'anilist_id' THEN ($1::jsonb->>'anilist_id')::bigint
        ELSE anilist_id
    END,
    hikka_id = CASE
        WHEN $1::jsonb ? 'hikka_id' THEN $1::jsonb->>'hikka_id'
        ELSE hikka_id
    END,
    imdb_id = CASE
        WHEN $1::jsonb ? 'imdb_id' THEN $1::jsonb->>'imdb_id'
        ELSE imdb_id
    END,
    year_released = CASE
        WHEN $1::jsonb ? 'year_released' THEN ($1::jsonb->>'year_released')::smallint
        ELSE year_released
    END,
    avg_episode_duration = CASE
        WHEN $1::jsonb ? 'avg_episode_duration' THEN ($1::jsonb->>'avg_episode_duration')::smallint
        ELSE avg_episode_duration
    END,
    episodes_count = CASE
        WHEN $1::jsonb ? 'episodes_count' THEN ($1::jsonb->>'episodes_count')::smallint
        ELSE episodes_count
    END,
    age_restriction = CASE
        WHEN $1::jsonb ? 'age_restriction' THEN ($1::jsonb->>'age_restriction')::mpaa_rating_enum
        ELSE age_restriction
    END,
    anime_status = CASE
        WHEN $1::jsonb ? 'anime_status' THEN ($1::jsonb->>'anime_status')::anime_status_enum
        ELSE anime_status
    END,
    anime_format = CASE
        WHEN $1::jsonb ? 'anime_format' THEN ($1::jsonb->>'anime_format')::anime_format_enum
        ELSE anime_format
    END,
    available = CASE
        WHEN $1::jsonb ? 'available' THEN ($1::jsonb->>'available')::boolean
        ELSE available
    END
WHERE anime_id = $2::uuid
RETURNING anime_id`;

export interface PatchAnimeByIdArgs {
    patchData: any;
    animeId: string;
}

export interface PatchAnimeByIdRow {
    animeId: string;
}

export async function patchAnimeById(client: Client, args: PatchAnimeByIdArgs): Promise<PatchAnimeByIdRow | null> {
    const result = await client.query({
        text: patchAnimeByIdQuery,
        values: [args.patchData, args.animeId],
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

export const deleteAnimeByIdQuery = `-- name: DeleteAnimeById :one
DELETE FROM public.animes
WHERE anime_id = $1::uuid
RETURNING anime_id`;

export interface DeleteAnimeByIdArgs {
    animeId: string;
}

export interface DeleteAnimeByIdRow {
    animeId: string;
}

export async function deleteAnimeById(client: Client, args: DeleteAnimeByIdArgs): Promise<DeleteAnimeByIdRow | null> {
    const result = await client.query({
        text: deleteAnimeByIdQuery,
        values: [args.animeId],
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

export const deleteAnimeGenresQuery = `-- name: DeleteAnimeGenres :exec
DELETE FROM public.genres
WHERE anime_id = $1::uuid`;

export interface DeleteAnimeGenresArgs {
    animeId: string;
}

export async function deleteAnimeGenres(client: Client, args: DeleteAnimeGenresArgs): Promise<void> {
    await client.query({
        text: deleteAnimeGenresQuery,
        values: [args.animeId],
        rowMode: "array"
    });
}

export const insertAnimeGenresQuery = `-- name: InsertAnimeGenres :exec
INSERT INTO public.genres (anime_id, genre_type)
SELECT $1::uuid, g
FROM unnest($2::genre_type_enum[]) AS g
ON CONFLICT DO NOTHING`;

export interface InsertAnimeGenresArgs {
    animeId: string;
    genres: string[];
}

export async function insertAnimeGenres(client: Client, args: InsertAnimeGenresArgs): Promise<void> {
    await client.query({
        text: insertAnimeGenresQuery,
        values: [args.animeId, args.genres],
        rowMode: "array"
    });
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

export const selectAnimesAboveAverageEpisodesQuery = `-- name: SelectAnimesAboveAverageEpisodes :many
SELECT
    a.anime_id,
    a.slug,
    a.title_ua,
    a.title_en,
    a.episodes_count
FROM public.animes a
WHERE a.episodes_count > (
    SELECT AVG(episodes_count)
    FROM public.animes
    WHERE episodes_count > 0
)
ORDER BY a.episodes_count DESC, a.title_ua`;

export interface SelectAnimesAboveAverageEpisodesRow {
    animeId: string;
    slug: string;
    titleUa: string;
    titleEn: string;
    episodesCount: number;
}

export async function selectAnimesAboveAverageEpisodes(client: Client): Promise<SelectAnimesAboveAverageEpisodesRow[]> {
    const result = await client.query({
        text: selectAnimesAboveAverageEpisodesQuery,
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

export const selectAnimesWithMaxEpisodesQuery = `-- name: SelectAnimesWithMaxEpisodes :many
SELECT
    a.anime_id,
    a.slug,
    a.title_ua,
    a.title_en,
    a.episodes_count
FROM public.animes a
WHERE a.episodes_count = (SELECT MAX(episodes_count) FROM public.animes)
ORDER BY a.title_ua`;

export interface SelectAnimesWithMaxEpisodesRow {
    animeId: string;
    slug: string;
    titleUa: string;
    titleEn: string;
    episodesCount: number;
}

export async function selectAnimesWithMaxEpisodes(client: Client): Promise<SelectAnimesWithMaxEpisodesRow[]> {
    const result = await client.query({
        text: selectAnimesWithMaxEpisodesQuery,
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

