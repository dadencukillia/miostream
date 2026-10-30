import sharp from "sharp";
import type { FastifyBaseLogger } from "fastify";
import type { S3Client } from "@aws-sdk/client-s3";
import {
  getAvatarById,
  removeAvatarById,
  setAvatarById
} from "./repos/avatarBucket.repo";
import { Pool } from "pg";
import {
  AvatarS3Error,
  AvatarNotFoundError,
  AvatarCouldntReachDBError,
  AvatarAlreadyNoAvatarError,
  AvatarAnotherRequestInProcessError,
  AvatarInvalidImageError
} from "./avatar.errors";
import { AvatarUpdatedResponse } from "./avatar.schema";
import { Static } from "@sinclair/typebox";
import { getAvatarIdByUserId, safeUpdateUserAvatar, updateUserAvatar } from "../../sqlc/users_sql";

const AVATAR_WIDTH = 256;
const AVATAR_HEIGHT = 256;
const WEBP_QUALITY = 80;

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

export async function resetUserAvatar(
  s3: S3Client, 
  db: Pool,
  logger: FastifyBaseLogger,
  userId: string
) {
  let avatarId: string|null;

  // Receive avatar id from database

  try {
    avatarId = (await updateUserAvatar(db, {
      userId: userId,
      newAvatarUrl: ""
    }))!.avatarUrl;
  } catch(e) {
    logger.error(e);
    throw new AvatarCouldntReachDBError("couldn't reset user avatar");
  }

  if (!avatarId) {
    throw new AvatarAlreadyNoAvatarError("already no avatar");
  }

  // Remove old avatar image file in S3

  try {
    await removeAvatarById(s3, avatarId);
  } catch(e) {
    logger.error(e);
    throw new AvatarS3Error("couldn't remove a file in the file storage");
  }
}

export async function updateUserAvatarImage(
  s3: S3Client, 
  db: Pool,
  logger: FastifyBaseLogger,
  userId: string,
  imageContent: Buffer
): Promise<Static<typeof AvatarUpdatedResponse>> {
  const newAvatarId = crypto.randomUUID().replaceAll("-", "");

  // Process image

  let webpImage: Buffer;

  try {
    webpImage = await sharp(imageContent)
      .resize(AVATAR_WIDTH, AVATAR_HEIGHT, { fit: "cover" })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  } catch(e) {
    logger.error(e);
    throw new AvatarInvalidImageError("invalid image");
  }

  // Get old avatar id

  let oldAvatarId: string|null;

  try {
    oldAvatarId = (await getAvatarIdByUserId(db, {
      userId: userId,
    }))!.avatarUrl;
  } catch(e) {
    logger.error(e);
    throw new AvatarCouldntReachDBError("couldn't receive old avatar id");
  }

  // Store new avatar file

  try {
    await setAvatarById(s3, newAvatarId, webpImage);
  } catch(e) {
    logger.error(e);
    throw new AvatarS3Error("couldn't store new avatar");
  }

  // Update avatar in the database

  try {
    const affected = (await safeUpdateUserAvatar(db, {
      userId: userId,
      oldAvatarUrl: oldAvatarId,
      newAvatarUrl: newAvatarId
    }))!.affected;
    if (!affected) {
      await removeAvatarById(s3, newAvatarId);
      throw new AvatarAnotherRequestInProcessError("concurrent requests conflict");
    }
  } catch(e) {
    logger.error(e);
    await removeAvatarById(s3, newAvatarId);
    throw new AvatarCouldntReachDBError("database avatar id update went wrong");
  }

  // Remove old avatar file

  if (oldAvatarId) {
    try {
      await removeAvatarById(s3, oldAvatarId);
    } catch(e) {
      logger.error(e);
      throw new AvatarS3Error("couldn't remove old avatar in the file storage")
    }
  }

  return {
    ok: true,
    userId: userId,
    avatarId: newAvatarId,
    format: "webp",
    url: `/cdn/avatar/${newAvatarId}.webp`
  };
}
