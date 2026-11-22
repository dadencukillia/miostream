-- name: CreateUser :one
INSERT INTO public.users(
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
    coalesce(sqlc.narg('timezone'), 'Europe/Kyiv')
)
RETURNING 
    "user_id",
    "nickname",
    "full_name",
    "email",
    "bio",
    "avatar_id",
    "max_streak",
    "timezone",
    "streak_start_date",
    "last_watch_date",
    "profile_frame_url",
    "profile_background_url",
    "user_role",
    "user_status",
    "created_at",
    "updated_at";

-- name: GetOrCreateUserByGoogleId :one
WITH inserted AS (
    INSERT INTO public.users(
        "nickname",
        "full_name",
        "email",
        "google_id",
        "timezone"
    ) VALUES (
        @nickname,
        @full_name,
        @email,
        @google_id::text,
        coalesce(sqlc.narg('timezone'), 'Europe/Kyiv')
    )
    ON CONFLICT ("google_id") DO NOTHING
    RETURNING 
        "user_id",
        "nickname",
        "full_name",
        "email",
        "bio",
        "avatar_id",
        "max_streak",
        "timezone",
        "streak_start_date",
        "last_watch_date",
        "profile_frame_url",
        "profile_background_url",
        "user_role",
        "user_status",
        "created_at",
        "updated_at"
)
SELECT 
    "user_id",
    "nickname",
    "full_name",
    "email",
    "bio",
    "avatar_id",
    "max_streak",
    "timezone",
    "streak_start_date",
    "last_watch_date",
    "profile_frame_url",
    "profile_background_url",
    "user_role",
    "user_status",
    "created_at",
    "updated_at"
FROM inserted
UNION ALL
SELECT 
    "user_id",
    "nickname",
    "full_name",
    "email",
    "bio",
    "avatar_id",
    "max_streak",
    "timezone",
    "streak_start_date",
    "last_watch_date",
    "profile_frame_url",
    "profile_background_url",
    "user_role",
    "user_status",
    "created_at",
    "updated_at"
FROM public.users
WHERE "google_id" = @google_id::text
    AND NOT EXISTS (SELECT 1 FROM inserted)
LIMIT 1;

-- name: GetUserById :one
SELECT 
    "user_id",
    "nickname",
    "full_name",
    "email",
    "bio",
    "avatar_id",
    "max_streak",
    "timezone",
    "streak_start_date",
    "last_watch_date",
    "profile_frame_url",
    "profile_background_url",
    "user_role",
    "user_status",
    "created_at",
    "updated_at"
FROM public.users
WHERE "user_id" = @user_id::uuid
LIMIT 1;

-- name: GetUserByNickname :one
SELECT 
    "user_id",
    "nickname",
    "full_name",
    "email",
    "bio",
    "avatar_id",
    "max_streak",
    "timezone",
    "streak_start_date",
    "last_watch_date",
    "profile_frame_url",
    "profile_background_url",
    "user_role",
    "user_status",
    "created_at",
    "updated_at"
FROM public.users
WHERE lower("nickname") = lower(@nickname::text)
LIMIT 1;

-- name: GetUserByEmail :one
SELECT 
    "user_id",
    "nickname",
    "full_name",
    "email",
    "bio",
    "avatar_id",
    "max_streak",
    "timezone",
    "streak_start_date",
    "last_watch_date",
    "profile_frame_url",
    "profile_background_url",
    "user_role",
    "user_status",
    "created_at",
    "updated_at"
FROM public.users
WHERE lower("email") = lower(@email)
LIMIT 1;

-- name: GetUserByGoogleId :one
SELECT 
    "user_id",
    "nickname",
    "full_name",
    "email",
    "bio",
    "avatar_id",
    "max_streak",
    "timezone",
    "streak_start_date",
    "last_watch_date",
    "profile_frame_url",
    "profile_background_url",
    "user_role",
    "user_status",
    "created_at",
    "updated_at"
FROM public.users
WHERE "google_id" = @google_id
LIMIT 1;

-- name: GetPasswordHashById :one
SELECT "password_hash"
FROM public.users
WHERE "user_id" = @user_id::uuid
LIMIT 1;

-- name: UpdateUserProfile :one
UPDATE public.users 
SET 
    "nickname"   = COALESCE(sqlc.narg('nickname')::text, nickname),
    "full_name"  = COALESCE(sqlc.narg('full_name')::text, full_name),
    "bio"        = COALESCE(sqlc.narg('bio')::text, bio),
    "timezone"   = COALESCE(sqlc.narg('timezone')::text, timezone),
    "updated_at" = now()
WHERE "user_id" = @user_id::uuid
RETURNING 
    "user_id",
    "nickname",
    "full_name",
    "email",
    "bio",
    "avatar_id",
    "max_streak",
    "timezone",
    "streak_start_date",
    "last_watch_date",
    "profile_frame_url",
    "profile_background_url",
    "user_role",
    "user_status",
    "created_at",
    "updated_at";

-- name: UpdateUserCustomization :one
UPDATE public.users 
SET 
    "profile_frame_url" = CASE 
        WHEN 'profile_frame_url' = ANY(sqlc.arg('null_fields')::text[]) THEN NULL
        ELSE COALESCE(sqlc.narg('profile_frame_url')::text, profile_frame_url)
    END,
    "profile_background_url" = CASE 
        WHEN 'profile_background_url' = ANY(sqlc.arg('null_fields')::text[]) THEN NULL
        ELSE COALESCE(sqlc.narg('profile_background_url')::text, profile_background_url)
    END,
    "updated_at" = now()
WHERE "user_id" = @user_id::uuid
RETURNING 
    "user_id",
    "nickname",
    "full_name",
    "email",
    "bio",
    "avatar_id",
    "max_streak",
    "timezone",
    "streak_start_date",
    "last_watch_date",
    "profile_frame_url",
    "profile_background_url",
    "user_role",
    "user_status",
    "created_at",
    "updated_at";

-- name: UpdateUserPassword :one
UPDATE public.users
SET 
    "password_hash" = @password_hash,
    "updated_at"    = now()
WHERE "user_id" = @user_id::uuid
RETURNING "user_id";

-- name: UpdateUserStreak :one
UPDATE public.users
SET 
    "max_streak"        = @max_streak,
    "streak_start_date" = sqlc.narg('streak_start_date'),
    "last_watch_date"   = sqlc.narg('last_watch_date'),
    "updated_at"        = now()
WHERE "user_id" = @user_id::uuid
RETURNING 
    "user_id",
    "nickname",
    "full_name",
    "email",
    "bio",
    "avatar_id",
    "max_streak",
    "timezone",
    "streak_start_date",
    "last_watch_date",
    "profile_frame_url",
    "profile_background_url",
    "user_role",
    "user_status",
    "created_at",
    "updated_at";

-- name: UpdateUserStatus :one
UPDATE public.users
SET
    "user_status" = @user_status,
    "updated_at"  = now()
WHERE "user_id" = @user_id::uuid
RETURNING 
    "user_id",
    "nickname",
    "full_name",
    "email",
    "bio",
    "avatar_id",
    "max_streak",
    "timezone",
    "streak_start_date",
    "last_watch_date",
    "profile_frame_url",
    "profile_background_url",
    "user_role",
    "user_status",
    "created_at",
    "updated_at";

-- name: UpdateUserRole :one
UPDATE public.users
SET 
    "user_role"   = @user_role,
    "updated_at"  = now()
WHERE "user_id" = @user_id::uuid
RETURNING 
    "user_id",
    "nickname",
    "full_name",
    "email",
    "bio",
    "avatar_id",
    "max_streak",
    "timezone",
    "streak_start_date",
    "last_watch_date",
    "profile_frame_url",
    "profile_background_url",
    "user_role",
    "user_status",
    "created_at",
    "updated_at";

-- name: DeleteUserById :one
DELETE FROM public.users
WHERE "user_id" = @user_id::uuid
RETURNING "user_id";

-- name: SelectUserById :one
SELECT *
FROM public.users
WHERE "id" = @user_id::uuid
LIMIT 1;

-- name: GetAvatarIdByUserId :one
SELECT avatar_id
FROM public.users
WHERE user_id = $1
LIMIT 1;

-- name: UpdateUserAvatarReturningOld :one
WITH old_vals AS (
  SELECT avatar_id, user_id 
  FROM public.users
  WHERE "user_id" = @user_id::uuid
  FOR UPDATE
) UPDATE public.users u
SET
  "avatar_id" = sqlc.narg('new_avatar_id')::uuid,
  "updated_at" = now()
FROM old_vals o
WHERE u.user_id = o.user_id
RETURNING
    o."user_id",
    u."nickname",
    u."full_name",
    u."email",
    u."bio",
    u."avatar_id",
    o."avatar_id" AS old_avatar_id,
    u."max_streak",
    u."timezone",
    u."streak_start_date",
    u."last_watch_date",
    u."profile_frame_url",
    u."profile_background_url",
    u."user_role",
    u."user_status",
    u."created_at",
    u."updated_at";
