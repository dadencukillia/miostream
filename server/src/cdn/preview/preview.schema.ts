import { Type } from "typebox";
import type { FastifySchema } from "fastify";
import { ErrorResponse } from "@lib/errorsCollection";

const CDN_TAG = "CDN";

// Get Preview

export const PreviewIdRequestParams = Type.Object({
	previewId: Type.String({
		format: "uuid",
		description: "Preview ID"
	}),
});

export const PreviewResponse = Type.Any({ description: "Binary format of image/webp" });

export const GetPreviewSchema: FastifySchema = {
	tags: [CDN_TAG],
	summary: "Returns episode preview image in webp format",
	params: PreviewIdRequestParams,
	response: {
		200: PreviewResponse,
		404: ErrorResponse,
		500: ErrorResponse,
	}
};
