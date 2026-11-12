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

    let commentsRaw: commentsSqlc.GetCommentsByAnimeIdRow[];

    try {
        commentsRaw = await commentsSqlc.getCommentsByAnimeId(client, {
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

    const comments: dto.CommentResponseType[] = commentsRaw.map((cr) => ({
        commentId: String(cr.commentId),
        content: cr.content,
        createdAt: cr.createdAt,
        isEdited: cr.isEdited,
        author: {
            userId: cr.userId,
            nickname: cr.nickname,
            avatarId: cr.avatarId,
        },
    }));

    const lastComment = commentsRaw.length === maxCount ? commentsRaw[commentsRaw.length - 1] : undefined;
    const nextCursor = lastComment ? String(lastComment.commentId) : null;

    return {
        comments,
        nextCursor,
    };
};