import type { FastifyBaseLogger } from "fastify";
import type { S3Client } from "@aws-sdk/client-s3";
import { getPreviewById } from "./preview.repo";
import { PreviewErrors } from "./preview.errors";

// Services

export async function getPreview(s3: S3Client, logger: FastifyBaseLogger, previewId: string): Promise<Buffer> {
	let preview: Uint8Array | null;

	try {
		preview = await getPreviewById(s3, previewId);
	} catch (e) {
		logger.error(e);

		throw PreviewErrors
			.error("unreachable-s3-storage")
			.withDetails(e);
	}

	if (!preview) throw PreviewErrors.error("preview-not-found");
	return Buffer.from(preview);
}
