import type { FastifyReply, FastifyRequest } from "fastify";
import "@context";
import { ScheduleErrors } from "./schedule.errors";
import type * as dto from "./schedule.dto";
import * as services from "./schedule.service";

export const getUpcomingEpisodes = async (
    request: FastifyRequest<{
        Querystring: dto.GetUpcomingEpisodesRequestQueriesType;
    }>,
    reply: FastifyReply<{
        Querystring: dto.GetUpcomingEpisodesRequestQueriesType;
        Reply: dto.GetUpcomingEpisodesResponseType;
    }>
) => {
    const result = await services.getUpcomingEpisodes(
        request.server.pg,
        request.query
    );

    return reply.status(200).send(result);
};

export const createUpcomingEpisode = async (
    request: FastifyRequest<{
        Body: dto.CreateUpcomingEpisodeRequestPayloadType;
    }>,
    reply: FastifyReply<{
        Body: dto.CreateUpcomingEpisodeRequestPayloadType;
        Reply: dto.UpcomingEpisodeResponseType;
    }>
) => {
    if (request.body.episodeName.trim().length === 0) {
        throw ScheduleErrors.error("schedule-invalid");
    }

    const created = await services.createUpcomingEpisode(
        request.server.pg,
        request.body
    );

    return reply.status(201).send(created);
};