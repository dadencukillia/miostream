import type { FastifyBaseLogger } from "fastify";
import type { S3Client } from "@aws-sdk/client-s3";
import { getAvatarById } from "./avatarBucket.repo";
import { AvatarErrors } from "./avatar.errors";

// Services

export async function getAvatar(s3: S3Client, logger: FastifyBaseLogger, avatarId: string): Promise<Buffer> {
  let avatar: Uint8Array|null;

  try {
    avatar = await getAvatarById(s3, avatarId);
  } catch(e) {
    logger.error(e);

    throw AvatarErrors
      .error("unreachable-s3-storage")
      .withDetails(e);
  }

  if (!avatar) throw AvatarErrors.error("avatar-not-found");
  return Buffer.from(avatar);
}
