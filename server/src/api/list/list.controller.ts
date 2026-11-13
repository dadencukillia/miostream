import type { FastifyReply, FastifyRequest } from "fastify";
import * as dto from "./list.dto";
import * as listService from "./list.service";

export const createListUnit = async (
	request: FastifyRequest<{
		Body: dto.CreateListUnitRequestPayloadType;
	}>,
	reply: FastifyReply<{
		Body: dto.CreateListUnitRequestPayloadType;
		Reply: dto.ListUnitResponseType;
	}>
) => {
	const userId = request.auth!.userId;
	const result = await listService.createListUnit(
		request.server.pg,
		userId,
		request.body
	);

	return reply.status(201).send(result);
};

export const updateListUnit = async (
	request: FastifyRequest<{
		Params: { animeId: string };
		Body: dto.UpdateListUnitRequestPayloadType;
	}>,
	reply: FastifyReply<{
		Params: { animeId: string };
		Body: dto.UpdateListUnitRequestPayloadType;
		Reply: dto.ListUnitResponseType;
	}>
) => {
	const userId = request.auth!.userId;
	const result = await listService.updateListUnit(
		request.server.pg,
		userId,
		request.params.animeId,
		request.body
	);

	return reply.status(200).send(result);
};

export const deleteListUnit = async (
	request: FastifyRequest<{
		Params: { animeId: string };
	}>,
	reply: FastifyReply<{
		Params: { animeId: string };
		Reply: null;
	}>
) => {
	const userId = request.auth!.userId;

	await listService.deleteListUnit(
		request.server.pg,
		userId,
		request.params.animeId
	);

	return reply.status(204).send(null);
};
