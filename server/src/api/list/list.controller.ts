import type { FastifyReply, FastifyRequest } from "fastify";
import type { CreateListUnitRequestPayloadType, UpdateListUnitRequestPayloadType } from "./list.dto";
import * as listService from "./list.service";

export const createListUnit = async (
	request: FastifyRequest<{ Body: CreateListUnitRequestPayloadType }>,
	reply: FastifyReply,
) => {
	const userId = request.auth!.userId;
	const result = await listService.createListUnit(request.server.pg, userId, request.body);
	return reply.status(201).send(result);
};
export const updateListUnit = async (
	request: FastifyRequest<{ Params: { animeId: string }; Body: UpdateListUnitRequestPayloadType }>,
	reply: FastifyReply,
) => {
	const userId = request.auth!.userId;
	const result = await listService.updateListUnit(request.server.pg, userId, request.params.animeId, request.body);
	return reply.status(200).send(result);
};

export const deleteListUnit = async (
	request: FastifyRequest<{ Params: { animeId: string } }>,
	reply: FastifyReply,
) => {
	const userId = request.auth!.userId;
	await listService.deleteListUnit(request.server.pg, userId, request.params.animeId);
	return reply.status(204).send();
};