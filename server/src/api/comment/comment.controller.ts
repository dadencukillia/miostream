import type { FastifyRequest, FastifyReply } from "fastify";
import { CommentErrors } from "./comment.errors";
import * as dto from "./comment.dto";
import * as services from "./comment.service";

export const getComments = async (
    request: FastifyRequest<{
        Params: dto.AnimeIdCommentRequestParamsType;
        Querystring: dto.GetCommentsRequestQueriesType;
    }>,
    reply: FastifyReply<{
        Params: dto.AnimeIdCommentRequestParamsType;
        Querystring: dto.GetCommentsRequestQueriesType;
        Reply: dto.GetCommentsReturnType;
    }>
) => {
    const result = await services.getComments(
        request.server.pg,
        request.params.animeId,
        request.query
    );

    return reply.status(200).send(result);
};

export const postComment = async (
    request: FastifyRequest<{
        Params: dto.AnimeIdCommentRequestParamsType;
        Body: dto.PostCommentRequestPayloadType;
    }>,
    reply: FastifyReply<{
        Params: dto.AnimeIdCommentRequestParamsType;
        Body: dto.PostCommentRequestPayloadType;
        Reply: dto.PostCommentReturnType;
    }>
) => {
    if (request.body.content.trim().length === 0) {
        throw CommentErrors.error("comment-invalid");
    }

    const comment = await services.postComment(
        request.server.pg,
        request.params.animeId,
        request.auth!.userId,
        request.body
    );

    return reply.status(201).send(comment);
};

export const updateComment = async (
    request: FastifyRequest<{
        Params: dto.CommentRequestParamsType;
        Body: dto.UpdateCommentRequestPayloadType;
    }>,
    reply: FastifyReply<{
        Params: dto.CommentRequestParamsType;
        Body: dto.UpdateCommentRequestPayloadType;
        Reply: dto.UpdateCommentReturnType;
    }>
) => {
    if (request.body.content.trim().length === 0) {
        throw CommentErrors.error("comment-invalid");
    }

    const comment = await services.updateComment(
        request.server.pg,
        request.params.animeId,
        request.params.commentId,
        request.auth!.userId,
        request.body
    );

    return reply.status(200).send(comment);
};

export const deleteComment = async (
    request: FastifyRequest<{
        Params: dto.CommentRequestParamsType;
    }>,
    reply: FastifyReply<{
        Params: dto.CommentRequestParamsType;
        Reply: dto.DeleteCommentReturnType;
    }>
) => {
    const role = request.auth?.role;
    const isPrivileged = role === "admin" || role === "moderator";

    await services.deleteComment(
        request.server.pg,
        request.params.animeId,
        request.params.commentId,
        request.auth!.userId,
        isPrivileged
    );

    return reply.status(204).send(null);
};