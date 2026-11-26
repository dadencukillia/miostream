-- name: CreateUpcomingEpisode :one
INSERT INTO public.upcoming_episodes(
    anime_id,
    episode_name,
    episode_date
) VALUES (
    @anime_id::uuid,
    @episode_name::text,
    @episode_date::timestamptz
)
RETURNING
    upcoming_episode_id,
    anime_id,
    episode_name,
    episode_date;

-- name: GetUpcomingEpisodesByDate :many
SELECT
    ue.upcoming_episode_id,
    ue.episode_name,
    ue.episode_date,
    a.anime_id,
    a.slug,
    a.title_ua,
    a.title_en,
    a.title_original,
    a.cover_id,
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
    ARRAY(
        SELECT g.genre_type
        FROM public.genres g
        WHERE g.anime_id = a.anime_id
        ORDER BY g.genre_type
    )::text[] AS genres
FROM public.upcoming_episodes ue
INNER JOIN public.animes a ON a.anime_id = ue.anime_id
WHERE ue.episode_date >= @from_date::timestamptz
  AND ue.episode_date < @to_date::timestamptz
ORDER BY ue.episode_date ASC, ue.upcoming_episode_id ASC;

-- name: DeleteUpcomingEpisode :one
DELETE FROM public.upcoming_episodes
WHERE upcoming_episode_id = @upcoming_episode_id::uuid
RETURNING upcoming_episode_id;

-- name: UpdateUpcomingEpisode :one
UPDATE public.upcoming_episodes
SET
    episode_name = COALESCE(sqlc.narg('episode_name')::text, episode_name),
    episode_date = CASE
        WHEN sqlc.narg('episode_date')::timestamptz IS NULL THEN episode_date
        ELSE sqlc.narg('episode_date')::timestamptz
    END
WHERE upcoming_episode_id = @upcoming_episode_id::uuid
RETURNING
    upcoming_episode_id,
    anime_id,
    episode_name,
    episode_date;

-- name: DeleteExpiredUpcomingEpisodes :exec
DELETE FROM public.upcoming_episodes
WHERE episode_date < CURRENT_TIMESTAMP - INTERVAL '1 month';