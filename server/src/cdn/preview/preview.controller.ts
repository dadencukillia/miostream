import type { FastifyReply, FastifyRequest } from "fastify";
import "@context";
import { getPreview } from "./preview.service";
import type * as dtos from "./preview.dto";

export const getPreviewController = async (
	request: FastifyRequest<{ Params: dtos.PreviewIdRequestParamsType }>,
	reply: FastifyReply<{ Params: dtos.PreviewIdRequestParamsType, Reply: dtos.GetPreviewReturnType }>
) => {
	const { previewId } = request.params;

	const buffer = await getPreview(request.server.s3, request.log, previewId);
	return reply
		.header("content-type", "image/webp")
		.header("cache-control", "public, max-age=31536000, immutable")
		.send(buffer);
};
