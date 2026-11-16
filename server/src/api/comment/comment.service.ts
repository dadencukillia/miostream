import type { Pool } from "pg";
import * as commentsSqlc from "@sqlc/comments_sql";
import { CommentErrors } from "./comment.errors";
import type * as dto from "./comment.dto";
import { commentTransformAuthor } from "./comment.model";

export const getComments = async (
    client: Pool,
    animeId: string,
    query: dto.GetCommentsRequestQueriesType
): Promise<dto.CommentsType> => {
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

    const comments: dto.CommentType[] = commentsRaw.map(commentTransformAuthor);

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
): Promise<dto.CommentType> => {
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

    return commentTransformAuthor(created);
};

export const updateComment = async (
    client: Pool,
    animeId: string,
    commentId: string,
    authorId: string,
    data: dto.UpdateCommentRequestPayloadType
): Promise<dto.CommentType> => {
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

    return commentTransformAuthor(updated);
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
