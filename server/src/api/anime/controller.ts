import type { FastifyReply, FastifyRequest } from "fastify";
import type {
	AnimeIdParams,
	AnimeListQuery,
	AnimeSlugParams,
	CreateAnimeRequest,
	UpdateAnimeRequest,
} from "./dto";
import * as animeService from "./service";

export async function listAnimes(
	request: FastifyRequest<{ Querystring: AnimeListQuery }>,
	reply: FastifyReply,
) {
	const result = await animeService.listAnimes(
		request.server.pg,
		request.query,
	);
	return reply.status(200).send(result);
}

export async function getAnime(
	request: FastifyRequest<{ Params: AnimeIdParams }>,
	reply: FastifyReply,
) {
	const anime = await animeService.getAnime(
		request.server.pg,
		request.params.id,
	);
	return reply.status(200).send(anime);
}

export async function getAnimeBySlug(
	request: FastifyRequest<{ Params: AnimeSlugParams }>,
	reply: FastifyReply,
) {
	const anime = await animeService.getAnimeBySlug(
		request.server.pg,
		request.params.slug,
	);
	return reply.status(200).send(anime);
}

export async function createAnime(
	request: FastifyRequest<{ Body: CreateAnimeRequest }>,
	reply: FastifyReply,
) {
	const anime = await animeService.createAnime(request.server.pg, request.body);
	return reply.status(201).send(anime);
}

export async function updateAnime(
	request: FastifyRequest<{
		Params: AnimeIdParams;
		Body: UpdateAnimeRequest;
	}>,
	reply: FastifyReply,
) {
	const anime = await animeService.updateAnime(
		request.server.pg,
		request.params.id,
		request.body,
	);
	return reply.status(200).send(anime);
}

export async function deleteAnime(
	request: FastifyRequest<{ Params: AnimeIdParams }>,
	reply: FastifyReply,
) {
	await animeService.deleteAnime(request.server.pg, request.params.id);
	return reply.status(204).send();
}

export async function countByStatus(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const result = await animeService.getAnimesCountByStatus(request.server.pg);
	return reply.status(200).send(result);
}

export async function studioStats(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const result = await animeService.getStudioStats(request.server.pg);
	return reply.status(200).send(result);
}

export async function formatStats(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const result = await animeService.getFormatStats(request.server.pg);
	return reply.status(200).send(result);
}

export async function studiosAboveAverage(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const result = await animeService.getStudiosAboveAverage(request.server.pg);
	return reply.status(200).send(result);
}

export async function aboveAverageEpisodes(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const result = await animeService.getAnimesAboveAverageEpisodes(
		request.server.pg,
	);
	return reply.status(200).send(result);
}

export async function maxEpisodes(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const result = await animeService.getAnimesWithMaxEpisodes(request.server.pg);
	return reply.status(200).send(result);
}