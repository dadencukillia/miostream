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

export const postComment = async (
    client: Pool,
    animeId: string,
    authorId: string,
    data: dto.PostCommentRequestPayloadType
): Promise<dto.CommentResponseType> => {
    let created: commentsSqlc.CreateCommentRow | null;

    try {
        created = await commentsSqlc.createComment(client, {
            animeId,
            authorId,
            content: data.content.trim(),
        });
    } catch (e: any) {
        if (e?.code === "23503") {
            throw CommentErrors.error("comment-db-data-not-found").withDetails(e);
        }
        if (e?.code === "23514" || e?.code === "22P02" || e?.code === "22001") {
            throw CommentErrors.error("comment-db-invalid-error").withDetails(e);
        }
        throw CommentErrors.error("comment-db-error").withDetails(e);
    }

    if (!created) {
        throw CommentErrors.error("comment-db-error");
    }

    return {
        commentId: String(created.commentId),
        content: created.content,
        createdAt: created.createdAt,
        isEdited: created.isEdited,
        author: {
            userId: created.userId,
            nickname: created.nickname,
            avatarId: created.avatarId,
        },
    };
};