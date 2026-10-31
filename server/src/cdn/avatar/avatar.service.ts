import sharp from "sharp";
import type { S3Client } from "@aws-sdk/client-s3";
import {
  getAvatarById,
  removeAvatarById,
  setAvatarById
} from "./avatarBucket.repo";
import { Pool } from "pg";
import { AvatarErrors } from "./avatar.errors";
import { AvatarUpdatedResponse } from "./avatar.schema";
import { Static } from "@sinclair/typebox";
import {
  getAvatarIdByUserId,
  safeUpdateUserAvatarReturningModificationFlag,
  updateUserAvatarReturningOld
} from "../../sqlc/users_sql";

const AVATAR_WIDTH = 256;
const AVATAR_HEIGHT = 256;
const WEBP_QUALITY = 80;

// Services

export async function getAvatar(s3: S3Client, avatarId: string): Promise<Buffer> {
  let avatar: Uint8Array|null;

  try {
    avatar = await getAvatarById(s3, avatarId);
  } catch(e) {
    throw AvatarErrors.error("unreachable-s3-storage").withDetails(e);
  }

  if (!avatar) throw AvatarErrors.error("avatar-not-found");
  return Buffer.from(avatar);
}

export async function resetUserAvatar(
  s3: S3Client, 
  db: Pool,
  userId: string
) {
  let avatarId: string|null;

  // Receive avatar id from database

  try {
    avatarId = (await updateUserAvatarReturningOld(db, {
      userId: userId,
      newAvatarUrl: ""
    }))!.avatarUrl;
  } catch(e) {
    throw AvatarErrors.error("update-avatar-db").withDetails(e);
  }

  if (!avatarId) {
    throw AvatarErrors.error("already-no-avatar");
  }

  // Remove old avatar image file in S3

  try {
    await removeAvatarById(s3, avatarId);
  } catch(e) {
    throw AvatarErrors.error("avatar-s3-remove").withDetails(e);
  }
}

export async function updateUserAvatarImage(
  s3: S3Client, 
  db: Pool,
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
    throw AvatarErrors.error("invalid-image").withDetails(e);
  }

  // Get old avatar id

  let oldAvatarId: string|null;

  try {
    oldAvatarId = (await getAvatarIdByUserId(db, {
      userId: userId,
    }))!.avatarUrl;
  } catch(e) {
    throw AvatarErrors.error("read-avatar-db").withDetails(e);
  }

  // Store new avatar file

  try {
    await setAvatarById(s3, newAvatarId, webpImage);
  } catch(e) {
    throw AvatarErrors.error("new-avatar-s3-store").withDetails(e);
  }

  // Update avatar in the database

  {
    let errorToThrow = AvatarErrors.error("update-avatar-db");
    try {
      const affected = (await safeUpdateUserAvatarReturningModificationFlag(db, {
        userId: userId,
        oldAvatarUrl: oldAvatarId!,
        newAvatarUrl: newAvatarId
      }))!.affected;
      if (!affected) {
        await removeAvatarById(s3, newAvatarId);
        errorToThrow = AvatarErrors.error("another-request-in-process");
        throw errorToThrow;
      }
    } catch(e) {
      await removeAvatarById(s3, newAvatarId);
      throw errorToThrow.withDetails(e);
    }
  }

  // Remove old avatar file

  if (oldAvatarId) {
    try {
      await removeAvatarById(s3, oldAvatarId);
    } catch(e) {
      throw AvatarErrors.error("avatar-s3-remove").withDetails(e);
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
