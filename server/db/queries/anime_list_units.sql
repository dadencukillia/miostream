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
    $1::uuid,
    $2::uuid,
    $3::int,
    $4::int,
    $5::date,
    $6::anime_list_unit_status_enum,
    $7::smallint
) RETURNING
    user_id,
    anime_id,
    watched_episodes,
    repeat_times,
    started_watching,
    list_unit_status,
    grade;