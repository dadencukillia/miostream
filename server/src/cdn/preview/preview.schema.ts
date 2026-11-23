import { Type } from "typebox";
import { ErrorResponse } from "@lib/errorsCollection";

// Tags
export const TAG_PREVIEW = "CDN";

// Responses
export const PreviewResponse = Type.Any({
	description: "Binary format of image/webp",
});

// Request Params
export const PreviewIdRequestParams = Type.Object({
	previewId: Type.String({
		pattern: "^[1-9][0-9]*$",
		description: "Episode ID",
		examples: ["42"],
	}),
}, {
	additionalProperties: false,
	description: "Route parameters containing episode preview identifier",
});

// Fastify Route Schemas
export const GetPreviewSchema = {
	tags: [TAG_PREVIEW],
	summary: "Get episode preview image",
	description: "Returns episode preview image in WebP format with ETag support.",
	params: PreviewIdRequestParams,
	response: {
		200: PreviewResponse,
		304: Type.Null({ description: "Preview image has not been modified" }),
		400: ErrorResponse,
		404: ErrorResponse,
		500: ErrorResponse,
	},
} as const;
