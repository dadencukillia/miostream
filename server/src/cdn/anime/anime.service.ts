import type { FastifyBaseLogger } from "fastify";
import type { S3Client } from "@aws-sdk/client-s3";
import { getAnimeCoverById } from "./anime.repo";
import { AnimeCoverErrors } from "./anime.errors";

export async function getAnimeCover(
  s3: S3Client,
  logger: FastifyBaseLogger,
  animeId: string,
): Promise<{ body: Buffer; etag: string | null }> {
  let cover: { body: Uint8Array; etag: string | null } | null;

  try {
    cover = await getAnimeCoverById(s3, animeId);
  } catch (e) {
    logger.error(e);

    throw AnimeCoverErrors
      .error("unreachable-s3-storage")
      .withDetails(e);
  }

  if (!cover) throw AnimeCoverErrors.error("anime-cover-not-found");
  return { body: Buffer.from(cover.body), etag: cover.etag };
}
