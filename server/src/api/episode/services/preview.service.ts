import type { Pool } from "pg";
import type { S3Client } from "@aws-sdk/client-s3";
import { EpisodeErrors, PreviewErrors } from "../episode.errors";
import { removePreviewById } from "@/cdn/preview/preview.shared";
import {
	resetEpisodePreviewReturningOld,
	type ResetEpisodePreviewReturningOldRow,
} from "@sqlc/episodes_sql";

export async function resetEpisodePreview(
	s3: S3Client,
	db: Pool,
	animeId: string,
	episodeId: string
): Promise<void> {
	// Reset preview_id in database, return old

	let dbResponse: ResetEpisodePreviewReturningOldRow | null;

	try {
		dbResponse = await resetEpisodePreviewReturningOld(db, {
			episodeId,
			animeId,
		});
	} catch (e) {
		throw PreviewErrors.error("update-preview-db").withDetails(e);
	}

	if (dbResponse == null) {
		throw EpisodeErrors.error("not-found");
	}

	if (dbResponse.oldPreviewId == null) {
		throw PreviewErrors.error("already-no-preview");
	}

	// Remove preview image file in S3 (key: ${episodeId}.webp)

	try {
		await removePreviewById(s3, episodeId);
	} catch (e) {
		throw PreviewErrors.error("preview-s3-remove").withDetails(e);
	}
}