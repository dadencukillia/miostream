import type { Pool } from "pg";
import * as commentsSqlc from "@sqlc/comments_sql";
import { CommentErrors } from "./comment.errors";
import * as dto from "./comment.dto";

export const getComments = async (
    client: Pool,
    animeId: string,
    query: dto.GetCommentsRequestQueriesType
): Promise<dto.CommentsResponseType> => {
    const maxCount = query.limit ?? 20;
    const lastLoadedId = query.cursor ?? "0";

    let rows: commentsSqlc.GetCommentsByAnimeIdRow[];

    try {
        rows = await commentsSqlc.getCommentsByAnimeId(client, {
            animeId,
            lastLoadedId,
            maxCount,
        });
    } catch (e: any) {
        if (e?.code === "22P02") {
            throw CommentErrors.error("comment-db-invalid-error").withDetails(e);
        }
        throw CommentErrors.error("comment-db-error").withDetails(e);
    }

    const comments: dto.CommentResponseType[] = rows.map((row) => ({
        commentId: String(row.commentId),
        content: row.content,
        createdAt: row.createdAt,
        isEdited: row.isEdited,
        author: {
            userId: row.userId,
            nickname: row.nickname,
            avatarId: row.avatarId,
        },
    }));

    const lastRow = rows.length === maxCount ? rows[rows.length - 1] : undefined;
    const nextCursor = lastRow ? String(lastRow.commentId) : null;

    return {
        comments,
        nextCursor,
    };
};