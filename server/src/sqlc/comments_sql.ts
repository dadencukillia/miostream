import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getCommentsByAnimeIdQuery = `-- name: GetCommentsByAnimeId :many
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
    c.anime_id = $1::uuid
    AND (
        $2::bigint <= 0 
        OR c.comment_id < $2::bigint
    )
ORDER BY c.comment_id DESC
LIMIT $3::int`;

export interface GetCommentsByAnimeIdArgs {
    animeId: string;
    lastLoadedId: string;
    maxCount: number;
}

export interface GetCommentsByAnimeIdRow {
    commentId: string;
    content: string;
    createdAt: Date;
    isEdited: boolean;
    userId: string;
    nickname: string;
    avatarId: string | null;
}

export async function getCommentsByAnimeId(client: Client, args: GetCommentsByAnimeIdArgs): Promise<GetCommentsByAnimeIdRow[]> {
    const result = await client.query({
        text: getCommentsByAnimeIdQuery,
        values: [args.animeId, args.lastLoadedId, args.maxCount],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            commentId: row[0],
            content: row[1],
            createdAt: row[2],
            isEdited: row[3],
            userId: row[4],
            nickname: row[5],
            avatarId: row[6]
        };
    });
}

export const createCommentQuery = `-- name: CreateComment :one
WITH inserted_comment AS (
    INSERT INTO public.comments(
        anime_id,
        author_id,
        content
    ) VALUES (
        $1::uuid,
        $2::uuid,
        $3::text
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
    u.user_id = ic.author_id`;

export interface CreateCommentArgs {
    animeId: string;
    authorId: string;
    content: string;
}

export interface CreateCommentRow {
    commentId: string;
    content: string;
    createdAt: Date;
    isEdited: boolean;
    userId: string;
    nickname: string;
    avatarId: string | null;
}

export async function createComment(client: Client, args: CreateCommentArgs): Promise<CreateCommentRow | null> {
    const result = await client.query({
        text: createCommentQuery,
        values: [args.animeId, args.authorId, args.content],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        commentId: row[0],
        content: row[1],
        createdAt: row[2],
        isEdited: row[3],
        userId: row[4],
        nickname: row[5],
        avatarId: row[6]
    };
}

