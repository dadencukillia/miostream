UPDATE "User"
SET 
    -- Update only if key exists and is not null
    "nickname"        = COALESCE(($2::jsonb)->>'nickname', "nickname"),
    "name"            = COALESCE(($2::jsonb)->>'name', "name"),
    "email"           = COALESCE(($2::jsonb)->>'email', "email"),
    "timezone"        = COALESCE(($2::jsonb)->>'timezone', "timezone"),
    "last_action"     = COALESCE((($2::jsonb)->>'last_action')::date, "last_action"),

    -- Update only if key exists in the object (allows setting to NULL)
    "bio"             = CASE WHEN ($2::jsonb) ? 'bio' THEN ($2::jsonb)->>'bio' ELSE "bio" END,
    "avatar_url"      = CASE WHEN ($2::jsonb) ? 'avatar_url' THEN ($2::jsonb)->>'avatar_url' ELSE "avatar_url" END,
    "social_networks" = CASE 
        WHEN NOT (($2::jsonb) ? 'social_networks') THEN "social_networks"
        WHEN (($2::jsonb)->>'social_networks') IS NULL THEN NULL
        ELSE ARRAY(SELECT jsonb_array_elements_text(($2::jsonb)->'social_networks'))
    END,

    -- Update only if exists; apply DEFAULT enum if null
    "profile_frame" = CASE 
        WHEN NOT (($2::jsonb) ? 'profile_frame') THEN "profile_frame"
        WHEN (($2::jsonb)->>'profile_frame') IS NULL THEN 'DEFAULT'::"ProfileFrame"
        ELSE (($2::jsonb)->>'profile_frame')::"ProfileFrame"
    END,
    "profile_background" = CASE 
        WHEN NOT (($2::jsonb) ? 'profile_background') THEN "profile_background"
        WHEN (($2::jsonb)->>'profile_background') IS NULL THEN 'DEFAULT'::"ProfileBackground"
        ELSE (($2::jsonb)->>'profile_background')::"ProfileBackground"
    END,

    -- Always bump timestamp
    "updated_at" = NOW()

WHERE "id" = $1::uuid
RETURNING *;