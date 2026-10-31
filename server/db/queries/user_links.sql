-- name: CreateUserLink :one
INSERT INTO public.user_links(
    "user_id",
    "user_link_url"
) VALUES (
    @user_id::uuid,
    @user_link_url
)
RETURNING *;

-- name: ListUserLinksByUserId :many
SELECT 
    "user_link_id",
    "user_id",
    "user_link_url"
FROM public.user_links
WHERE "user_id" = @user_id::uuid
ORDER BY "user_link_id" ASC;

-- name: UpdateUserLink :one
UPDATE public.user_links
SET 
    "user_link_url" = @user_link_url
WHERE "user_link_id" = @user_link_id
    AND "user_id" = @user_id::uuid
RETURNING *;

-- name: DeleteUserLink :one
DELETE FROM public.user_links
WHERE "user_link_id" = @user_link_id
    AND "user_id" = @user_id::uuid
RETURNING "user_link_id";