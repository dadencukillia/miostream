-- name: CreateUpcomingEpisode :one
INSERT INTO public.upcoming_episodes(
    anime_id,
    episode_name,
    episode_date
) VALUES (
    @anime_id::uuid,
    @episode_name::text,
    (@episode_date::timestamp AT TIME ZONE 'UTC')
)
RETURNING
    upcoming_episode_id,
    anime_id,
    episode_name,
    episode_date;