import type { FastifyReply, FastifyRequest } from "fastify";
import type {
	AnimeIdParamsType,
	AnimeListQueryType,
	AnimeSlugParamsType,
	CreateAnimeBodyType,
	UpdateAnimeBodyType,
} from "./anime.dto";
import * as animeService from "./anime.service";
import { isUuid, normalizeUuid } from "@utils/uuid";

export const listAnimes = async (
	request: FastifyRequest<{ Querystring: AnimeListQueryType }>,
	reply: FastifyReply,
) => {
	const result = await animeService.listAnimes(
		request.server.pg,
		request.query,
	);
	return reply.status(200).send(result);
};

export const getAnime = async (
	request: FastifyRequest<{ Params: { idOrSlug: string } }>,
	reply: FastifyReply,
) => {
	const { idOrSlug } = request.params;
	const normalizedId = normalizeUuid(idOrSlug);
	const anime = normalizedId
		? await animeService.getAnime(request.server.pg, normalizedId)
		: await animeService.getAnimeBySlug(request.server.pg, idOrSlug);
	return reply.status(200).send(anime);
};

export const createAnime = async (
	request: FastifyRequest<{ Body: CreateAnimeBodyType }>,
	reply: FastifyReply,
) => {
	const anime = await animeService.createAnime(request.server.pg, request.body);
	return reply.status(201).send(anime);
};

export const updateAnime = async (
	request: FastifyRequest<{
		Params: AnimeIdParamsType;
		Body: UpdateAnimeBodyType;
	}>,
	reply: FastifyReply,
) => {
	const anime = await animeService.updateAnime(
		request.server.pg,
		request.params.id,
		request.body,
	);
	return reply.status(200).send(anime);
};

export const deleteAnime = async (
	request: FastifyRequest<{ Params: AnimeIdParamsType }>,
	reply: FastifyReply,
) => {
	await animeService.deleteAnime(request.server.pg, request.params.id);
	return reply.status(204).send();
};

export const countByStatus = async (
	request: FastifyRequest,
	reply: FastifyReply,
) => {
	const result = await animeService.getAnimesCountByStatus(request.server.pg);
	return reply.status(200).send(result);
};

export const studioStats = async (
	request: FastifyRequest,
	reply: FastifyReply,
) => {
	const result = await animeService.getStudioStats(request.server.pg);
	return reply.status(200).send(result);
};

export const formatStats = async (
	request: FastifyRequest,
	reply: FastifyReply,
) => {
	const result = await animeService.getFormatStats(request.server.pg);
	return reply.status(200).send(result);
};

export const studiosAboveAverage = async (
	request: FastifyRequest,
	reply: FastifyReply,
) => {
	const result = await animeService.getStudiosAboveAverage(request.server.pg);
	return reply.status(200).send(result);
};

export const aboveAverageEpisodes = async (
	request: FastifyRequest,
	reply: FastifyReply,
) => {
	const result = await animeService.getAnimesAboveAverageEpisodes(
		request.server.pg,
	);
	return reply.status(200).send(result);
};

export const maxEpisodes = async (
	request: FastifyRequest,
	reply: FastifyReply,
) => {
	const result = await animeService.getAnimesWithMaxEpisodes(request.server.pg);
	return reply.status(200).send(result);
};