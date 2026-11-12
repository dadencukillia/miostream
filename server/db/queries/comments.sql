-- name: GetCommentsByAnimeId :many
SELECT 
    c.comment_id,
    c.content,
    c.created_at,
    c.is_edited,
    u.user_id,
    u.nickname,
    u.avatar_id
FROM public.comments c
INNER JOIN public.users u ON 
    u.user_id = c.author_id
WHERE 
    c.anime_id = @anime_id::uuid
    AND (
        @last_loaded_id::bigint <= 0 
        OR c.comment_id < @last_loaded_id::bigint
    )
ORDER BY c.comment_id DESC
LIMIT @max_count::int;

-- name: CreateComment :one
WITH inserted_comment AS (
    INSERT INTO public.comments(
        anime_id,
        author_id,
        content
    ) VALUES (
        @anime_id::uuid,
        @author_id::uuid,
        @content::text
    )
    RETURNING
        comment_id,
        author_id,
        content,
        created_at,
        is_edited
)
SELECT
    ic.comment_id,
    ic.content,
    ic.created_at,
    ic.is_edited,
    u.user_id,
    u.nickname,
    u.avatar_id
FROM inserted_comment ic
INNER JOIN public.users u ON
    u.user_id = ic.author_id;