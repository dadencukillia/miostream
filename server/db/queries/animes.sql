-- name: CreateAnime :one
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
    @slug::text,
    @title_ua::text,
    @title_en::text,
    @title_original::text,
    @anime_description::text,
    @cover_url::text,
    @production_studio::text,
    sqlc.narg('mal_id')::bigint,
    sqlc.narg('anilist_id')::bigint,
    sqlc.narg('hikka_id')::text,
    sqlc.narg('imdb_id')::text,
    sqlc.narg('year_released')::smallint,
    @avg_episode_duration::smallint,
    @episodes_count::smallint,
    sqlc.narg('age_restriction')::mpaa_rating_enum,
    sqlc.narg('anime_status')::anime_status_enum,
    @anime_format::anime_format_enum,
    @available::boolean
)
RETURNING anime_id; --or 1

-- name: CreateAnimeGenres :exec
INSERT INTO public.genres (anime_id, genre_type)
SELECT @anime_id::uuid, g
FROM unnest(@genres::genre_type_enum[]) AS g
ON CONFLICT DO NOTHING;

-- name: ListAnimes :many
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
    (sqlc.narg('search')::text IS NULL OR
        a.slug ILIKE '%' || sqlc.narg('search')::text || '%' OR
        a.title_ua ILIKE '%' || sqlc.narg('search')::text || '%' OR
        a.title_en ILIKE '%' || sqlc.narg('search')::text || '%' OR
        a.title_original ILIKE '%' || sqlc.narg('search')::text || '%')
    AND (sqlc.narg('genre')::genre_type_enum IS NULL OR EXISTS (
        SELECT 1
        FROM public.genres fg
        WHERE fg.anime_id = a.anime_id
          AND fg.genre_type = sqlc.narg('genre')::genre_type_enum
    ))
    AND (sqlc.narg('status')::anime_status_enum IS NULL OR a.anime_status = sqlc.narg('status')::anime_status_enum)
    AND (sqlc.narg('format')::anime_format_enum IS NULL OR a.anime_format = sqlc.narg('format')::anime_format_enum)
    AND (sqlc.narg('year')::smallint IS NULL OR a.year_released = sqlc.narg('year')::smallint)
    AND (sqlc.narg('available')::boolean IS NULL OR a.available = sqlc.narg('available')::boolean)
ORDER BY
    CASE WHEN @sort::text = 'oldest' THEN a.anime_id END ASC,
    CASE WHEN @sort::text = 'title' THEN lower(a.title_ua) END ASC,
    CASE WHEN @sort::text = 'year_desc' THEN a.year_released END DESC NULLS LAST,
    CASE WHEN @sort::text = 'year_asc' THEN a.year_released END ASC NULLS LAST,
    a.anime_id DESC
LIMIT sqlc.arg('limit')::int OFFSET sqlc.arg('offset')::int;

-- name: CountAnimes :one
SELECT COUNT(*)::int AS total
FROM public.animes a
WHERE
    (sqlc.narg('search')::text IS NULL OR
        a.slug ILIKE '%' || sqlc.narg('search')::text || '%' OR
        a.title_ua ILIKE '%' || sqlc.narg('search')::text || '%' OR
        a.title_en ILIKE '%' || sqlc.narg('search')::text || '%' OR
        a.title_original ILIKE '%' || sqlc.narg('search')::text || '%')
    AND (sqlc.narg('genre')::genre_type_enum IS NULL OR EXISTS (
        SELECT 1
        FROM public.genres fg
        WHERE fg.anime_id = a.anime_id
          AND fg.genre_type = sqlc.narg('genre')::genre_type_enum
    ))
    AND (sqlc.narg('status')::anime_status_enum IS NULL OR a.anime_status = sqlc.narg('status')::anime_status_enum)
    AND (sqlc.narg('format')::anime_format_enum IS NULL OR a.anime_format = sqlc.narg('format')::anime_format_enum)
    AND (sqlc.narg('year')::smallint IS NULL OR a.year_released = sqlc.narg('year')::smallint)
    AND (sqlc.narg('available')::boolean IS NULL OR a.available = sqlc.narg('available')::boolean);

-- name: GetAnimeById :one
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
WHERE a.anime_id = @anime_id::uuid;

-- name: GetAnimeBySlug :one
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
WHERE a.slug = @slug::text;

-- name: CountAnimesByStatus :many
SELECT
    a.anime_status,
    COUNT(*)::int AS total
FROM public.animes a
WHERE a.available = TRUE
  AND a.anime_status IS NOT NULL
GROUP BY a.anime_status
ORDER BY total DESC;

-- name: GetStudioStats :many
SELECT
    a.production_studio AS studio,
    COUNT(*)::int AS titles_count,
    COALESCE(SUM(a.episodes_count), 0)::int AS total_episodes,
    ROUND(AVG(NULLIF(a.avg_episode_duration, 0))::numeric, 1)::float8 AS avg_episode_duration
FROM public.animes a
WHERE a.production_studio <> ''
GROUP BY a.production_studio
ORDER BY total_episodes DESC, a.production_studio;

-- name: GetFormatStats :many
SELECT
    a.anime_format,
    COUNT(*)::int AS titles_count,
    ROUND(AVG(a.episodes_count)::numeric, 1)::float8 AS avg_episodes,
    MAX(a.episodes_count)::int AS max_episodes,
    MIN(a.episodes_count)::int AS min_episodes
FROM public.animes a
GROUP BY a.anime_format
ORDER BY titles_count DESC;

-- name: GetStudiosAboveAverageEpisodes :many
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
ORDER BY avg_episodes DESC;

-- name: GetOngoingAnimes :many
SELECT
    a.anime_id,
    a.slug,
    a.title_ua,
    a.title_en,
    a.episodes_count
FROM public.animes a
WHERE a.anime_status = 'ongoing'::anime_status_enum
ORDER BY a.episodes_count DESC, a.title_ua;

-- name: GetAvailableAnimesByCurrentYear :many
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
ORDER BY "year_released" DESC;

-- name: UpdateAnimeById :one
UPDATE public.animes
SET
    "slug"                 = COALESCE(@slug::text, slug),
    "title_ua"             = COALESCE(@title_ua::text, title_ua),
    "title_en"             = COALESCE(sqlc.narg('title_en')::text, title_en),
    "title_original"       = COALESCE(sqlc.narg('title_original')::text, title_original),
    "anime_description"    = COALESCE(sqlc.narg('anime_description')::text, anime_description),
    "cover_url"            = COALESCE(sqlc.narg('cover_url')::text, cover_url),
    "production_studio"    = COALESCE(sqlc.narg('production_studio')::text, production_studio),
    "mal_id"               = sqlc.narg('mal_id')::bigint,
    "anilist_id"           = sqlc.narg('anilist_id')::bigint,
    "hikka_id"             = sqlc.narg('hikka_id')::text,
    "imdb_id"              = sqlc.narg('imdb_id')::text,
    "year_released"        = COALESCE(sqlc.narg('year_released')::smallint, year_released),
    "avg_episode_duration" = COALESCE(sqlc.narg('avg_episode_duration')::smallint, avg_episode_duration),
    "episodes_count"       = COALESCE(sqlc.narg('episodes_count')::smallint, episodes_count),
    "age_restriction"      = COALESCE(sqlc.narg('age_restriction')::mpaa_rating_enum, age_restriction),
    "anime_status"         = COALESCE(sqlc.narg('anime_status')::anime_status_enum, anime_status),
    "anime_format"         = COALESCE(@anime_format::anime_format_enum, anime_format),
    "available"            = COALESCE(@available::boolean, available),
    "updated_at"           = NOW()
WHERE "anime_id" = @anime_id::uuid
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
    "available";

-- name: UpdateAnimeStatusById :one
UPDATE public.animes
SET
    "anime_status" = @anime_status::anime_status_enum,
    "updated_at"   = NOW()
WHERE "anime_id" = @anime_id::uuid
RETURNING "anime_id",
          "anime_status";

-- name: UpdateAnimeAvailableById :one
UPDATE public.animes
SET
    "available"  = @available::boolean,
    "updated_at" = NOW()
WHERE "anime_id" = @anime_id::uuid
RETURNING "anime_id",
          "available";

-- name: IncrementAnimeEpisodesById :one
UPDATE public.animes
SET
    "episodes_count" = GREATEST(episodes_count, @episodes_count::smallint),
    "updated_at"     = NOW()
WHERE "anime_id" = @anime_id::uuid
RETURNING "anime_id",
          "episodes_count";