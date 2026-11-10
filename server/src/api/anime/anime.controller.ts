import type { FastifyReply, FastifyRequest } from "fastify";
import type {
	AnimeIdRequestParamsType,
	ListAnimesRequestQueriesType,
	AnimeSlugRequestParamsType,
	CreateAnimeRequestPayloadType,
	UpdateAnimeRequestPayloadType,
} from "./anime.dto";
import * as animeService from "./anime.service";

export const listAnimes = async (
	request: FastifyRequest<{ Querystring: ListAnimesRequestQueriesType }>,
	reply: FastifyReply,
) => {
	const result = await animeService.listAnimes(
		request.server.pg,
		request.query,
	);
	return reply.status(200).send(result);
};

export const getAnime = async (
	request: FastifyRequest<{ Params: AnimeIdRequestParamsType }>,
	reply: FastifyReply,
) => {
	const anime = await animeService.getAnime(
		request.server.pg,
		request.params.id,
	);
	return reply.status(200).send(anime);
};

export const getAnimeBySlug = async (
	request: FastifyRequest<{ Params: AnimeSlugRequestParamsType }>,
	reply: FastifyReply,
) => {
	const anime = await animeService.getAnimeBySlug(
		request.server.pg,
		request.params.slug,
	);
	return reply.status(200).send(anime);
};

export const createAnime = async (
	request: FastifyRequest<{ Body: CreateAnimeRequestPayloadType }>,
	reply: FastifyReply,
) => {
	const anime = await animeService.createAnime(request.server.pg, request.body);
	return reply.status(201).send(anime);
};

export const updateAnime = async (
	request: FastifyRequest<{
		Params: AnimeIdRequestParamsType;
		Body: UpdateAnimeRequestPayloadType;
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
	request: FastifyRequest<{ Params: AnimeIdRequestParamsType }>,
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
