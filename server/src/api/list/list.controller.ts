import type { FastifyReply, FastifyRequest } from "fastify";
import type { CreateListUnitRequestPayloadType } from "./list.dto";
import * as listService from "./list.service";

export const createListUnit = async (
	request: FastifyRequest<{ Body: CreateListUnitRequestPayloadType }>,
	reply: FastifyReply,
) => {
	const userId = request.auth!.userId;
	const result = await listService.createListUnit(request.server.pg, userId, request.body);
	return reply.status(201).send(result);
};