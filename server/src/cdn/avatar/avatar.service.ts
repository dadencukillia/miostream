import type { FastifyBaseLogger } from "fastify";
import type { S3Client } from "@aws-sdk/client-s3";
import { getAvatarById, removeAvatarById, setAvatarById } from "./repos/avatarBucket.repo";
import type { PostgresClient } from "@prisma/orm-postgres/runtime";
import { getAvatarIdByUserId, setAvatarIdForUser, setAvatarIdForUserReturningOld } from "./repos/userDatabase.repo";
import type { Contract } from "../../prisma/contract";
import { processImage } from "./repos/image.repo";
import type { UpdateAvatarResult } from "./dto";

// Errors

export class AvatarError extends Error { status = 500; }

export class AvatarS3Error extends AvatarError { override status = 500; }
export class AvatarNotFoundError extends AvatarError { override status = 404; }
export class AvatarCouldntReachDBError extends AvatarError { override status = 500; }
export class AvatarAlreadyNoAvatarError extends AvatarError { override status = 409; }
export class AvatarAnotherRequestInProcessError extends AvatarError { override status = 409; }
export class AvatarInvalidImageError extends AvatarError { override status = 400; }

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
  db: PostgresClient<Contract>,
  logger: FastifyBaseLogger,
  userId: string
) {
  let avatarId: string|null;

  // Receive avatar id from database

  try {
    avatarId = await setAvatarIdForUserReturningOld(db, userId, null);
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
  db: PostgresClient<Contract>,
  logger: FastifyBaseLogger,
  userId: string,
  imageContent: Buffer
): Promise<UpdateAvatarResult> {
  const newAvatarId = crypto.randomUUID().replaceAll("-", "");

  // Process image

  let webpImage: Buffer;

  try {
    webpImage = await processImage(imageContent);
  } catch(e) {
    logger.error(e);
    throw new AvatarInvalidImageError("invalid image");
  }

  // Get old avatar id

  let oldAvatarId: string|null;

  try {
    oldAvatarId = await getAvatarIdByUserId(db, userId);
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
    const updated = await setAvatarIdForUser(db, userId, oldAvatarId, newAvatarId);
    if (!updated) {
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
    user: userId,
    avatar: newAvatarId,
    format: "webp",
    url: `/cdn/avatar/${newAvatarId}.webp`
  };
}
