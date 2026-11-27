import sharp from "sharp";
import type { Pool } from "pg";
import type { S3Client } from "@aws-sdk/client-s3";
import { EpisodeErrors, PreviewErrors } from "../episode.errors";
import { removePreviewById, setPreviewById } from "@/cdn/preview/preview.shared";
import {
	resetEpisodePreviewReturningOld,
	setEpisodePreview,
	type ResetEpisodePreviewReturningOldRow,
	type SetEpisodePreviewRow,
} from "@sqlc/episodes_sql";

const WEBP_QUALITY = 80;

export async function updateEpisodePreviewImage(
	s3: S3Client,
	db: Pool,
	animeId: string,
	episodeId: string,
	imageContent: Buffer
): Promise<SetEpisodePreviewRow> {
	// Process image (convert to WebP without resizing)

	let webpImage: Buffer;

	try {
		webpImage = await sharp(imageContent)
			.webp({ quality: WEBP_QUALITY })
			.toBuffer();
	} catch (e) {
		throw PreviewErrors.error("invalid-image").withDetails(e);
	}

	// Store preview file in S3

	try {
		await setPreviewById(s3, episodeId, webpImage);
	} catch (e) {
		throw PreviewErrors.error("new-preview-s3-store").withDetails(e);
	}

	// Update preview_id in the database

	let dbResponse: SetEpisodePreviewRow | null;

	try {
		dbResponse = await setEpisodePreview(db, {
			episodeId,
			animeId,
		});
	} catch (e) {
		throw PreviewErrors.error("update-preview-db").withDetails(e);
	}

	if (dbResponse == null) {
		await removePreviewById(s3, episodeId).catch(() => { });
		throw EpisodeErrors.error("not-found");
	}

	return dbResponse;
}

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
