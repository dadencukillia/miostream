import type { FastifyReply, FastifyRequest } from "fastify";
import "@context";
import type * as dto from "./preview.dto";
import * as services from "./preview.service";

const PREVIEW_CACHE_CONTROL = "public, max-age=3600";

export const getPreview = async (
	request: FastifyRequest<{ Params: dto.PreviewIdRequestParamsType }>,
	reply: FastifyReply<{ Params: dto.PreviewIdRequestParamsType; Reply: dto.GetPreviewReturnType }>
) => {
	const { previewId } = request.params;
	const ifNoneMatch = request.headers["if-none-match"];

	const result = await services.getPreview(request.server.s3, previewId, ifNoneMatch);

	reply.header("cache-control", PREVIEW_CACHE_CONTROL);
	if (result.etag) {
		reply.header("etag", result.etag);
	}

	if (result.notModified) {
		return reply.status(304).send(null);
	}

	return reply
		.header("content-type", "image/webp")
		.send(result.buffer);
};
