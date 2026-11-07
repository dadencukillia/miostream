import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createUserLinkQuery = `-- name: CreateUserLink :one
INSERT INTO public.user_links (
    "user_id",
    "user_link_url"
) VALUES (
    $1::uuid,
    $2
)
RETURNING 
    "user_link_id",
    "user_id",
    "user_link_url"`;

export interface CreateUserLinkArgs {
    userId: string;
    userLinkUrl: string;
}

export interface CreateUserLinkRow {
    userLinkId: string;
    userId: string;
    userLinkUrl: string;
}

export async function createUserLink(client: Client, args: CreateUserLinkArgs): Promise<CreateUserLinkRow | null> {
    const result = await client.query({
        text: createUserLinkQuery,
        values: [args.userId, args.userLinkUrl],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        userLinkId: row[0],
        userId: row[1],
        userLinkUrl: row[2]
    };
}

export const listUserLinksByUserIdQuery = `-- name: ListUserLinksByUserId :many
SELECT 
    "user_link_id",
    "user_id",
    "user_link_url"
FROM public.user_links
WHERE "user_id" = $1::uuid
ORDER BY "user_link_id" ASC`;

export interface ListUserLinksByUserIdArgs {
    userId: string;
}

export interface ListUserLinksByUserIdRow {
    userLinkId: string;
    userId: string;
    userLinkUrl: string;
}

export async function listUserLinksByUserId(client: Client, args: ListUserLinksByUserIdArgs): Promise<ListUserLinksByUserIdRow[]> {
    const result = await client.query({
        text: listUserLinksByUserIdQuery,
        values: [args.userId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            userLinkId: row[0],
            userId: row[1],
            userLinkUrl: row[2]
        };
    });
}

export const updateUserLinkQuery = `-- name: UpdateUserLink :one
UPDATE public.user_links
SET 
    "user_link_url" = $1
WHERE "user_link_id" = $2
    AND "user_id" = $3::uuid
RETURNING 
    "user_link_id",
    "user_id",
    "user_link_url"`;

export interface UpdateUserLinkArgs {
    userLinkUrl: string;
    userLinkId: string;
    userId: string;
}

export interface UpdateUserLinkRow {
    userLinkId: string;
    userId: string;
    userLinkUrl: string;
}

export async function updateUserLink(client: Client, args: UpdateUserLinkArgs): Promise<UpdateUserLinkRow | null> {
    const result = await client.query({
        text: updateUserLinkQuery,
        values: [args.userLinkUrl, args.userLinkId, args.userId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        userLinkId: row[0],
        userId: row[1],
        userLinkUrl: row[2]
    };
}

export const deleteUserLinkQuery = `-- name: DeleteUserLink :one
DELETE FROM public.user_links
WHERE "user_link_id" = $1
    AND "user_id" = $2::uuid
RETURNING "user_link_id"`;

export interface DeleteUserLinkArgs {
    userLinkId: string;
    userId: string;
}

export interface DeleteUserLinkRow {
    userLinkId: string;
}

export async function deleteUserLink(client: Client, args: DeleteUserLinkArgs): Promise<DeleteUserLinkRow | null> {
    const result = await client.query({
        text: deleteUserLinkQuery,
        values: [args.userLinkId, args.userId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        userLinkId: row[0]
    };
}

