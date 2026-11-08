import type { FastifyBaseLogger } from "fastify";
import type { S3Client } from "@aws-sdk/client-s3";
import {
  getAvatarById,
} from "./avatarBucket.repo";
import {
  AvatarS3Error,
  AvatarNotFoundError,
} from "./avatar.errors";

// Services

export async function getAvatar(s3: S3Client, logger: FastifyBaseLogger, avatarId: string): Promise<Buffer> {
  let avatar: Uint8Array|null;

  try {
    avatar = await getAvatarById(s3, avatarId);
  } catch(e) {
    logger.error(e);

    throw new AvatarS3Error("couldn't reach the file storage");
  }

  if (!avatar) throw new AvatarNotFoundError("no avatar found");
  return Buffer.from(avatar);
}
