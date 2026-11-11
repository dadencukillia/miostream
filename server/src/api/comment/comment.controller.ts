import type { FastifyRequest, FastifyReply } from "fastify";
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