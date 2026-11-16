import type { FastifyReply, FastifyRequest } from "fastify";
import type {
	AnimeIdRequestParamsType,
	ListAnimesRequestQueriesType,
	AnimeIdOrSlugRequestParamsType,
	CreateAnimeRequestPayloadType,
	UpdateAnimeRequestPayloadType,
} from "./anime.dto";
import * as animeService from "./anime.service";
import { AnimeErrors } from "./anime.errors";
import { normalizeUuid } from "@utils/uuid";

const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assertValidId(id: string) {
	if (!id?.trim()) throw AnimeErrors.error("anime-invalid").withMessage("anime ID is required");
	if (!UUID_RE.test(id)) throw AnimeErrors.error("anime-invalid").withMessage("anime ID must be a valid UUID");
}

function assertValidSlug(slug: string) {
	if (!slug?.trim()) throw AnimeErrors.error("anime-invalid").withMessage("slug is required");
	if (slug.length > 200) throw AnimeErrors.error("anime-invalid").withMessage("slug must not exceed 200 characters");
	if (!SLUG_RE.test(slug)) {
		throw AnimeErrors.error("anime-invalid").withMessage("slug must contain only lowercase latin letters, digits and single hyphens");
	}
}

function assertHasTitle(titles: Array<string | null | undefined>) {
	if (!titles.some((title) => (title ?? "").trim().length > 0)) {
		throw AnimeErrors.error("anime-invalid").withMessage("at least one title (title_ua, title_en or title_original) is required");
	}
}

export const listAnimes = async (
	request: FastifyRequest<{ Querystring: ListAnimesRequestQueriesType }>,
	reply: FastifyReply,
) => {
	const result = await animeService.listAnimes(
		request.server.pg,
		request.query,
	);
	return reply.status(200).send({ ok: true, ...result });
};

export const getAnime = async (
	request: FastifyRequest<{ Params: AnimeIdOrSlugRequestParamsType }>,
	reply: FastifyReply,
) => {
	const { identifier } = request.params;
	const normalizedId = normalizeUuid(identifier);
	if (normalizedId) {
		const anime = await animeService.getAnime(request.server.pg, normalizedId);
		return reply.status(200).send({ ok: true, ...anime });
	}
	assertValidSlug(identifier);
	const anime = await animeService.getAnimeBySlug(request.server.pg, identifier);
	return reply.status(200).send({ ok: true, ...anime });
};

export const createAnime = async (
	request: FastifyRequest<{ Body: CreateAnimeRequestPayloadType }>,
	reply: FastifyReply<{ Body: CreateAnimeRequestPayloadType }>,
) => {
	assertValidSlug(request.body.slug);
	assertHasTitle([request.body.titleUa, request.body.titleEn, request.body.titleOriginal]);
	const anime = await animeService.createAnime(request.server.pg, request.body);
	return reply.status(201).send({ ok: true, ...anime });
};

export const updateAnime = async (
	request: FastifyRequest<{
		Params: AnimeIdRequestParamsType;
		Body: UpdateAnimeRequestPayloadType;
	}>,
	reply: FastifyReply,
) => {
	assertValidId(request.params.id);
	if (!request.body || Object.keys(request.body).length === 0) {
		throw AnimeErrors.error("anime-invalid").withMessage("update payload cannot be empty");
	}
	if (request.body.slug !== undefined) assertValidSlug(request.body.slug);
	const existing = await animeService.getAnime(request.server.pg, request.params.id);
	assertHasTitle([
		request.body.titleUa ?? existing.titleUa,
		request.body.titleEn ?? existing.titleEn,
		request.body.titleOriginal ?? existing.titleOriginal,
	]);
	const anime = await animeService.updateAnime(
		request.server.pg,
		request.params.id,
		request.body,
	);
	return reply.status(200).send({ ok: true, ...anime });
};

export const deleteAnime = async (
	request: FastifyRequest<{ Params: AnimeIdRequestParamsType }>,
	reply: FastifyReply,
) => {
	assertValidId(request.params.id);
	await animeService.deleteAnime(request.server.pg, request.params.id);
	return reply.status(200).send({ ok: true });
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