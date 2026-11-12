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
        if (e?.code === "22P02" || e?.code === "22003") {
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
        if (e?.code === "23514" || e?.code === "22P02" || e?.code === "22003" || e?.code === "22001") {
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

export const updateComment = async (
    client: Pool,
    animeId: string,
    commentId: string,
    authorId: string,
    data: dto.UpdateCommentRequestPayloadType
): Promise<dto.CommentResponseType> => {
    let updated: commentsSqlc.UpdateCommentRow | null;

    try {
        updated = await commentsSqlc.updateComment(client, {
            commentId,
            animeId,
            authorId,
            content: data.content.trim(),
        });
    } catch (e: any) {
        if (e?.code === "23514" || e?.code === "22P02" || e?.code === "22003" || e?.code === "22001") {
            throw CommentErrors.error("comment-db-invalid-error").withDetails(e);
        }
        throw CommentErrors.error("comment-db-error").withDetails(e);
    }

    if (!updated) {
        throw CommentErrors.error("comment-not-found");
    }

    return {
        commentId: String(updated.commentId),
        content: updated.content,
        createdAt: updated.createdAt,
        isEdited: updated.isEdited,
        author: {
            userId: updated.userId,
            nickname: updated.nickname,
            avatarId: updated.avatarId,
        },
    };
};

export const deleteComment = async (
    client: Pool,
    animeId: string,
    commentId: string,
    userId: string,
    isPrivileged: boolean
): Promise<void> => {
    let deleted: commentsSqlc.DeleteCommentRow | null;

    try {
        deleted = await commentsSqlc.deleteComment(client, {
            commentId,
            animeId,
            authorId: userId,
            isPrivileged,
        });
    } catch (e: any) {
        if (e?.code === "22P02" || e?.code === "22003") {
            throw CommentErrors.error("comment-db-invalid-error").withDetails(e);
        }
        throw CommentErrors.error("comment-db-error").withDetails(e);
    }

    if (!deleted) {
        throw CommentErrors.error("comment-not-found");
    }
};