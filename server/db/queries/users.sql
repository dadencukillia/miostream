-- name: CreateUser :one
INSERT INTO public.users (
    "nickname",
    "full_name",
    "email",
    "password_hash",
    "google_id",
    "timezone"
) VALUES (
    @nickname, 
    @full_name, 
    @email, 
    sqlc.narg('password_hash'),
    sqlc.narg('google_id'),
    COALESCE(sqlc.narg('timezone'), 'Europe/Kyiv')
)
RETURNING *;

-- name: GetUserById :one
SELECT *
FROM public.users
WHERE "user_id" = @user_id::uuid
LIMIT 1;

-- name: GetUserByEmail :one
SELECT *
FROM public.users
WHERE lower("email") = lower(@email)
LIMIT 1;

-- name: GetUserByGoogleId :one
SELECT *
FROM public.users
WHERE "google_id" = @google_id
LIMIT 1;

-- name: UpdateUserProfile :one
UPDATE public.users
SET 
    "nickname"   = @nickname,
    "full_name"  = @full_name,
    "bio"        = @bio,
    "timezone"   = @timezone,
    "updated_at" = NOW()
WHERE "user_id" = @user_id::uuid
RETURNING *;

-- name: UpdateUserAvatar :one
UPDATE public.users
SET
    "avatar_url" = @avatar_url,
    "updated_at" = NOW()
WHERE "user_id" = @user_id::uuid
RETURNING *;

-- name: UpdateUserCustomization :one
UPDATE public.users
SET 
    "profile_frame_url"      = sqlc.narg('profile_frame_url'),
    "profile_background_url" = sqlc.narg('profile_background_url'),
    "updated_at"             = NOW()
WHERE "user_id" = @user_id::uuid
RETURNING *;

-- name: UpdateUserPassword :exec
UPDATE public.users
SET 
    "password_hash" = @password_hash,
    "updated_at"    = NOW()
WHERE "user_id" = @user_id::uuid;

-- name: UpdateUserStreak :one
UPDATE public.users
SET 
    "max_streak"        = @max_streak,
    "streak_start_date" = sqlc.narg('streak_start_date'),
    "last_watch_date"   = sqlc.narg('last_watch_date'),
    "updated_at"        = NOW()
WHERE "user_id" = @user_id::uuid
RETURNING *;

-- name: UpdateUserStatus :one
UPDATE public.users
SET
    "user_status" = @user_status,
    "updated_at"  = NOW()
WHERE "user_id" = @user_id::uuid
RETURNING *;

-- name: UpdateUserRole :one
UPDATE public.users
SET 
    "user_role"   = @user_role,
    "updated_at"  = NOW()
WHERE "user_id" = @user_id::uuid
RETURNING *;

-- name: DeleteUserById :one
DELETE FROM public.users
WHERE "user_id" = @user_id::uuid
RETURNING *;