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
    CASE WHEN sqlc.arg('sort')::text = 'oldest' THEN a.anime_id END ASC,
    CASE WHEN sqlc.arg('sort')::text = 'title' THEN lower(a.title_ua) END ASC,
    CASE WHEN sqlc.arg('sort')::text = 'year_desc' THEN a.year_released END DESC NULLS LAST,
    CASE WHEN sqlc.arg('sort')::text = 'year_asc' THEN a.year_released END ASC NULLS LAST,
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

-- name: SelectAnimeById :one
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
WHERE a.anime_id = sqlc.arg('anime_id')::uuid;

-- name: SelectAnimeBySlug :one
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
WHERE a.slug = sqlc.arg('slug')::text;

-- name: InsertAnime :one
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
    sqlc.arg('slug')::text,
    sqlc.arg('title_ua')::text,
    sqlc.arg('title_en')::text,
    sqlc.arg('title_original')::text,
    sqlc.arg('anime_description')::text,
    sqlc.arg('cover_url')::text,
    sqlc.arg('production_studio')::text,
    sqlc.narg('mal_id')::bigint,
    sqlc.narg('anilist_id')::bigint,
    sqlc.narg('hikka_id')::text,
    sqlc.narg('imdb_id')::text,
    sqlc.narg('year_released')::smallint,
    sqlc.arg('avg_episode_duration')::smallint,
    sqlc.arg('episodes_count')::smallint,
    sqlc.narg('age_restriction')::mpaa_rating_enum,
    sqlc.narg('anime_status')::anime_status_enum,
    sqlc.arg('anime_format')::anime_format_enum,
    sqlc.arg('available')::boolean
)
RETURNING anime_id;

-- name: PatchAnimeById :one
UPDATE public.animes
SET
    slug = CASE
        WHEN sqlc.arg('patch_data')::jsonb ? 'slug' THEN sqlc.arg('patch_data')::jsonb->>'slug'
        ELSE slug
    END,
    title_ua = CASE
        WHEN sqlc.arg('patch_data')::jsonb ? 'title_ua' THEN sqlc.arg('patch_data')::jsonb->>'title_ua'
        ELSE title_ua
    END,
    title_en = CASE
        WHEN sqlc.arg('patch_data')::jsonb ? 'title_en' THEN sqlc.arg('patch_data')::jsonb->>'title_en'
        ELSE title_en
    END,
    title_original = CASE
        WHEN sqlc.arg('patch_data')::jsonb ? 'title_original' THEN sqlc.arg('patch_data')::jsonb->>'title_original'
        ELSE title_original
    END,
    anime_description = CASE
        WHEN sqlc.arg('patch_data')::jsonb ? 'anime_description' THEN sqlc.arg('patch_data')::jsonb->>'anime_description'
        ELSE anime_description
    END,
    cover_url = CASE
        WHEN sqlc.arg('patch_data')::jsonb ? 'cover_url' THEN sqlc.arg('patch_data')::jsonb->>'cover_url'
        ELSE cover_url
    END,
    production_studio = CASE
        WHEN sqlc.arg('patch_data')::jsonb ? 'production_studio' THEN sqlc.arg('patch_data')::jsonb->>'production_studio'
        ELSE production_studio
    END,
    mal_id = CASE
        WHEN sqlc.arg('patch_data')::jsonb ? 'mal_id' THEN (sqlc.arg('patch_data')::jsonb->>'mal_id')::bigint
        ELSE mal_id
    END,
    anilist_id = CASE
        WHEN sqlc.arg('patch_data')::jsonb ? 'anilist_id' THEN (sqlc.arg('patch_data')::jsonb->>'anilist_id')::bigint
        ELSE anilist_id
    END,
    hikka_id = CASE
        WHEN sqlc.arg('patch_data')::jsonb ? 'hikka_id' THEN sqlc.arg('patch_data')::jsonb->>'hikka_id'
        ELSE hikka_id
    END,
    imdb_id = CASE
        WHEN sqlc.arg('patch_data')::jsonb ? 'imdb_id' THEN sqlc.arg('patch_data')::jsonb->>'imdb_id'
        ELSE imdb_id
    END,
    year_released = CASE
        WHEN sqlc.arg('patch_data')::jsonb ? 'year_released' THEN (sqlc.arg('patch_data')::jsonb->>'year_released')::smallint
        ELSE year_released
    END,
    avg_episode_duration = CASE
        WHEN sqlc.arg('patch_data')::jsonb ? 'avg_episode_duration' THEN (sqlc.arg('patch_data')::jsonb->>'avg_episode_duration')::smallint
        ELSE avg_episode_duration
    END,
    episodes_count = CASE
        WHEN sqlc.arg('patch_data')::jsonb ? 'episodes_count' THEN (sqlc.arg('patch_data')::jsonb->>'episodes_count')::smallint
        ELSE episodes_count
    END,
    age_restriction = CASE
        WHEN sqlc.arg('patch_data')::jsonb ? 'age_restriction' THEN (sqlc.arg('patch_data')::jsonb->>'age_restriction')::mpaa_rating_enum
        ELSE age_restriction
    END,
    anime_status = CASE
        WHEN sqlc.arg('patch_data')::jsonb ? 'anime_status' THEN (sqlc.arg('patch_data')::jsonb->>'anime_status')::anime_status_enum
        ELSE anime_status
    END,
    anime_format = CASE
        WHEN sqlc.arg('patch_data')::jsonb ? 'anime_format' THEN (sqlc.arg('patch_data')::jsonb->>'anime_format')::anime_format_enum
        ELSE anime_format
    END,
    available = CASE
        WHEN sqlc.arg('patch_data')::jsonb ? 'available' THEN (sqlc.arg('patch_data')::jsonb->>'available')::boolean
        ELSE available
    END
WHERE anime_id = sqlc.arg('anime_id')::uuid
RETURNING anime_id;

-- name: DeleteAnimeById :one
DELETE FROM public.animes
WHERE anime_id = sqlc.arg('anime_id')::uuid
RETURNING anime_id;

-- name: DeleteAnimeGenres :exec
DELETE FROM public.genres
WHERE anime_id = sqlc.arg('anime_id')::uuid;

-- name: InsertAnimeGenres :exec
INSERT INTO public.genres (anime_id, genre_type)
SELECT sqlc.arg('anime_id')::uuid, g
FROM unnest(sqlc.arg('genres')::genre_type_enum[]) AS g
ON CONFLICT DO NOTHING;

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

-- name: SelectAnimesAboveAverageEpisodes :many
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
ORDER BY a.episodes_count DESC, a.title_ua;

-- name: SelectAnimesWithMaxEpisodes :many
SELECT
    a.anime_id,
    a.slug,
    a.title_ua,
    a.title_en,
    a.episodes_count
FROM public.animes a
WHERE a.episodes_count = (SELECT MAX(episodes_count) FROM public.animes)
ORDER BY a.title_ua;