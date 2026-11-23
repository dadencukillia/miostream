import type { S3Client } from "@aws-sdk/client-s3";
import { getPreviewById } from "./preview.repo";
import { PreviewErrors } from "./preview.errors";

export type GetPreviewResult =
	| { notModified: true; etag?: string }
	| { notModified: false; buffer: Buffer; etag?: string };

export const getPreview = async (
	s3: S3Client,
	previewId: string,
	ifNoneMatch?: string
): Promise<GetPreviewResult> => {
	let preview;

	try {
		preview = await getPreviewById(s3, previewId, ifNoneMatch);
	} catch (e) {
		throw PreviewErrors.error("unreachable-s3-storage").withDetails(e);
	}

	if (!preview) throw PreviewErrors.error("preview-not-found");

	if (preview.notModified) {
		return { notModified: true, etag: preview.etag };
	}

	return {
		notModified: false,
		buffer: Buffer.from(preview.content),
		etag: preview.etag,
	};
};
