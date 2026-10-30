-- name: DeleteUserById :one
DELETE FROM public.users
WHERE "id" = @user_id::uuid
RETURNING *;

-- name: InsertNewUser :one
INSERT INTO public.users (
    "nickname",
    "full_name",
    "email",
    "password_hash"
) VALUES (
    @nickname, @full_name, @email, @password_hash
)
RETURNING *;

-- name: PatchUserById :one
UPDATE public.users
SET 
    -- Update only if key exists and is not null
    "nickname"          = COALESCE((@patch_data::jsonb)->>'nickname', "nickname"),
    "full_name"         = COALESCE((@patch_data::jsonb)->>'full_name', "full_name"),
    "email"             = COALESCE((@patch_data::jsonb)->>'email', "email"),
    "timezone"          = COALESCE((@patch_data::jsonb)->>'timezone', "timezone"),
    
    -- Update only if key exists in the object (allows setting to NULL)
    "bio"               = CASE WHEN (@patch_data::jsonb) ? 'bio' THEN (@patch_data::jsonb)->>'bio' ELSE "bio" END,
    "avatar_url"        = CASE WHEN (@patch_data::jsonb) ? 'avatar_url' THEN (@patch_data::jsonb)->>'avatar_url' ELSE "avatar_url" END,
    "social_networks" = CASE 
        WHEN NOT ((@patch_data::jsonb) ? 'social_networks') THEN "social_networks"
        WHEN ((@patch_data::jsonb)->>'social_networks') IS NULL THEN NULL
        ELSE ARRAY(SELECT jsonb_array_elements_text((@patch_data::jsonb)->'social_networks'))
    END,

    -- Update only if exists; apply DEFAULT enum if null
    "profile_frame" = CASE 
        WHEN NOT ((@patch_data::jsonb) ? 'profile_frame') THEN "profile_frame"
        WHEN ((@patch_data::jsonb)->>'profile_frame') IS NULL THEN 'DEFAULT'::"ProfileFrame"
        ELSE ((@patch_data::jsonb)->>'profile_frame')::"ProfileFrame"
    END,
    "profile_background" = CASE 
        WHEN NOT ((@patch_data::jsonb) ? 'profile_background') THEN "profile_background"
        WHEN ((@patch_data::jsonb)->>'profile_background') IS NULL THEN 'DEFAULT'::"ProfileBackground"
        ELSE ((@patch_data::jsonb)->>'profile_background')::"ProfileBackground"
    END,

    -- Always bump timestamp
    "updated_at" = NOW()

WHERE "id" = @user_id::uuid
RETURNING *;

-- name: SelectUserById :one
SELECT *
FROM public.users
WHERE "id" = @user_id::uuid
LIMIT 1;

-- name: GetAvatarIdByUserId :one
SELECT avatar_url
FROM public.users
WHERE user_id = $1;

-- name: SafeUpdateUserAvatar :one
UPDATE public.users
SET avatar_url = @new_avatar_url::text
WHERE user_id = $1
  AND avatar_url = @old_avatar_url::text
RETURNING count(*) = 1 AS affected;

-- name: UpdateUserAvatar :one
UPDATE public.users
SET avatar_url = @new_avatar_url::text
WHERE user_id = $1
RETURNING avatar_url;

