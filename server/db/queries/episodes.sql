-- name: EpisodesListByAnimeId :many
SELECT episode_id, episode_name, localization_studio, localization_type
FROM public.episodes
WHERE
  anime_id = @anime_id::uuid
ORDER BY order_index ASC, episode_id ASC;

-- name: EpisodeById :one
SELECT anime_id, source_url, episode_name, localization_studio, localization_type
FROM public.episodes
WHERE episode_id = @episode_id::bigint
  AND anime_id = @anime_id::uuid;

-- name: CreateEpisode :one
INSERT INTO public.episodes(anime_id, source_url, episode_name, localization_studio, localization_type, order_index)
VALUES(
  $1, $2, $3, $4, $5,
  (SELECT coalesce(max(order_index), 0) + 100 FROM public.episodes WHERE anime_id = $1)
)
RETURNING *;

-- name: PutEpisode :one
UPDATE public.episodes
SET
  source_url = @new_source_url,
  episode_name = @new_episode_name,
  localization_studio = @new_localization_studio,
  localization_type = @new_localization_type
WHERE
  episode_id = @episode_id::bigint
  AND anime_id = @anime_id::uuid
RETURNING *;

-- name: ReorderEpisodes :exec
UPDATE public.episodes e
SET order_index = sub.rn * 100
FROM (
  SELECT episode_id,
         ROW_NUMBER() OVER (ORDER BY order_index, episode_id) AS rn
  FROM public.episodes
  WHERE anime_id = @anime_id::uuid
) sub
WHERE e.episode_id = sub.episode_id
  AND e.anime_id = @anime_id::uuid;

-- name: EpisodeSetAfter :one
UPDATE public.episodes
SET order_index = CASE
  WHEN sqlc.narg('prev_episode_id')::bigint IS NULL THEN 0
  ELSE (
    SELECT p.order_index + 50
    FROM public.episodes p
    WHERE p.episode_id = sqlc.narg('prev_episode_id')::bigint
      AND p.anime_id = @anime_id::uuid
  )
END
WHERE episode_id = @episode_id::bigint
  AND anime_id = @anime_id::uuid
  AND episode_id IS DISTINCT FROM sqlc.narg('prev_episode_id')::bigint
  AND (
    sqlc.narg('prev_episode_id')::bigint IS NULL
    OR EXISTS (
      SELECT 1 FROM public.episodes p
      WHERE p.episode_id = sqlc.narg('prev_episode_id')::bigint
        AND p.anime_id = @anime_id::uuid
    )
  )
RETURNING episode_id, order_index;

-- name: DeleteEpisodeById :one
DELETE FROM public.episodes
WHERE episode_id = @episode_id::bigint
  AND anime_id = @anime_id::uuid
RETURNING 1::integer AS success_flag;

-- name: LockAnimeEpisodes :exec
SELECT pg_advisory_xact_lock(hashtextextended((@anime_id::uuid)::text, 0));

-- name: ResetEpisodePreviewReturningOld :one
WITH old_vals AS (
  SELECT preview_id, episode_id
  FROM public.episodes
  WHERE "episode_id" = @episode_id::bigint
    AND "anime_id" = @anime_id::uuid
  FOR UPDATE
) UPDATE public.episodes e
SET
  "preview_id" = NULL
FROM old_vals o
WHERE e.episode_id = o.episode_id
RETURNING
  o."episode_id",
  o."preview_id" AS old_preview_id;