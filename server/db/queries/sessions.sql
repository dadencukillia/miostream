-- name: GetSessionById :one
SELECT
  session_id, user_id,
  refresh_token, expire_time, previous_refresh_token, rotated_at,
  device_type, device_name, os, browser, user_location, ip_address
FROM public.sessions
WHERE session_id = @session_id::bigint;

-- name: CreateSession :one
INSERT INTO public.sessions(
  user_id, refresh_token,
  device_type, device_name, os, browser, user_location, ip_address
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING
  session_id, user_id,
  refresh_token, expire_time, previous_refresh_token, rotated_at,
  device_type, device_name, os, browser, user_location, ip_address;

-- name: RotateRefreshToken :one
UPDATE public.sessions
SET
  previous_refresh_token = refresh_token,
  refresh_token = $1,
  rotated_at = timezone('UTC', now())
WHERE
  session_id = @session_id::bigint
  AND (
    @rotation_time::integer <= 0
    OR rotated_at + (@rotation_time::integer || ' milliseconds')::interval < timezone('UTC', now())
  )
RETURNING
  session_id, user_id,
  refresh_token, expire_time, previous_refresh_token, rotated_at,
  device_type, device_name, os, browser, user_location, ip_address;

-- name: DeleteExpiredSessions :exec
DELETE FROM public.sessions
WHERE expire_time < timezone('UTC', now());

-- name: DeleteSessionById :one
DELETE FROM public.sessions
WHERE session_id = @session_id::bigint
RETURNING
  session_id, user_id,
  refresh_token, expire_time, previous_refresh_token, rotated_at,
  device_type, device_name, os, browser, user_location, ip_address;
