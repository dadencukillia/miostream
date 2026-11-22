-- name: CreateListUnit :one
INSERT INTO public.anime_list_units (
    user_id,
    anime_id,
    watched_episodes,
    repeat_times,
    started_watching,
    list_unit_status,
    grade
) VALUES (
    sqlc.arg(user_id)::uuid,
    sqlc.arg(anime_id)::uuid,
    sqlc.arg(watched_episodes)::int,
    sqlc.arg(repeat_times)::int,
    sqlc.arg(started_watching)::date,
    sqlc.arg(list_unit_status)::anime_list_unit_status_enum,
    sqlc.narg(grade)::smallint
)
RETURNING *;

-- name: GetListUnit :one
SELECT *
FROM public.anime_list_units
WHERE user_id = sqlc.arg(user_id)::uuid AND anime_id = sqlc.arg(anime_id)::uuid;

-- name: UpdateListUnit :one
UPDATE public.anime_list_units
SET
    watched_episodes = sqlc.arg(watched_episodes)::int,
    repeat_times = sqlc.arg(repeat_times)::int,
    started_watching = sqlc.arg(started_watching)::date,
    list_unit_status = sqlc.arg(list_unit_status)::anime_list_unit_status_enum,
    grade = CASE
        WHEN 'grade' = ANY(sqlc.arg('null_fields')::text[]) THEN NULL
        ELSE COALESCE(sqlc.narg('grade')::smallint, grade)
    END
WHERE user_id = sqlc.arg(user_id)::uuid AND anime_id = sqlc.arg(anime_id)::uuid
RETURNING *;

-- name: DeleteListUnit :one
DELETE FROM public.anime_list_units
WHERE user_id = sqlc.arg(user_id)::uuid AND anime_id = sqlc.arg(anime_id)::uuid
RETURNING *;

-- name: CountListUnits :one
SELECT COUNT(*)::int AS total
FROM public.anime_list_units lu
WHERE lu.user_id = sqlc.arg(user_id)::uuid
  AND (sqlc.narg(status)::anime_list_unit_status_enum IS NULL OR lu.list_unit_status = sqlc.narg(status)::anime_list_unit_status_enum);

-- name: ListListUnits :many
SELECT
    lu.anime_id,
    a.slug,
    a.title_ua,
    a.title_en,
    a.cover_id,
    lu.watched_episodes,
    lu.repeat_times,
    lu.started_watching,
    lu.list_unit_status,
    lu.grade
FROM public.anime_list_units lu
JOIN public.animes a ON a.anime_id = lu.anime_id
WHERE lu.user_id = sqlc.arg(user_id)::uuid
  AND (sqlc.narg(status)::anime_list_unit_status_enum IS NULL OR lu.list_unit_status = sqlc.narg(status)::anime_list_unit_status_enum)
ORDER BY
    CASE WHEN sqlc.arg(sort)::text = 'grade' THEN lu.grade END DESC NULLS LAST,
    CASE WHEN sqlc.arg(sort)::text = 'startedWatching' THEN lu.started_watching END DESC,
    a.title_ua ASC
LIMIT sqlc.arg('limit')::int OFFSET sqlc.arg('offset')::int;
