import sharp from "sharp";
import type { Pool } from "pg";
import type { FastifyBaseLogger } from "fastify";
import type { S3Client } from "@aws-sdk/client-s3";
import {
    AvatarS3Error,
    AvatarCouldntReachDBError,
    AvatarAlreadyNoAvatarError,
    AvatarInvalidImageError
} from "../user.errors";
import {
    removeAvatarById,
    setAvatarById
} from "@/cdn/avatar/avatar.shared";
import {
    updateUserAvatarReturningOld
} from "@sqlc/users_sql";
import type { UserResponseDto } from "../user.schema";

const AVATAR_WIDTH = 256;
const AVATAR_HEIGHT = 256;
const WEBP_QUALITY = 80;


export async function updateUserAvatarImage(
    s3: S3Client,
    db: Pool,
    logger: FastifyBaseLogger,
    userId: string,
    imageContent: Buffer
): Promise<UserResponseDto> {
    const newAvatarId = crypto.randomUUID().replaceAll("-", "");

    // Process image

    let webpImage: Buffer;

    try {
        webpImage = await sharp(imageContent)
            .resize(AVATAR_WIDTH, AVATAR_HEIGHT, { fit: "cover" })
            .webp({ quality: WEBP_QUALITY })
            .toBuffer();
    } catch (e) {
        logger.error(e);
        throw new AvatarInvalidImageError("invalid image");
    }

    // Store new avatar file

    try {
        await setAvatarById(s3, newAvatarId, webpImage);
    } catch (e) {
        logger.error(e);
        throw new AvatarS3Error("couldn't store new avatar");
    }

    // Update avatar in the database

    let dbResponse;
    {
        try {
            dbResponse = await updateUserAvatarReturningOld(db, {
                userId: userId,
                newAvatarId: newAvatarId
            });
            if (dbResponse == null) {
              throw new Error("database user not found");
            }
        } catch (e) {
            logger.error(e);
            await removeAvatarById(s3, newAvatarId);
            throw new AvatarCouldntReachDBError("database avatar id update went wrong");
        }
    }

    // Remove old avatar file

    if (dbResponse.oldAvatarId) {
        try {
            await removeAvatarById(s3, dbResponse.oldAvatarId);
        } catch (e) {
            logger.error(e);
            throw new AvatarS3Error("couldn't remove old avatar in the file storage")
        }
    }

    const { oldAvatarId, ...toReturn } = dbResponse;
    return toReturn;
}

export async function resetUserAvatar(
    s3: S3Client,
    db: Pool,
    logger: FastifyBaseLogger,
    userId: string
): Promise<UserResponseDto> {
    // Update avatar id in database, return old

    let dbResponse;

    try {
        dbResponse = await updateUserAvatarReturningOld(db, {
            userId: userId,
            newAvatarId: null
        });
        if (dbResponse == null) {
          throw new Error("database user not found");
        }
    } catch (e) {
        logger.error(e);
        throw new AvatarCouldntReachDBError("couldn't reset user avatar");
    }

    if (dbResponse.avatarId == null) {
        throw new AvatarAlreadyNoAvatarError("already no avatar");
    }

    // Remove old avatar image file in S3

    try {
        await removeAvatarById(s3, dbResponse.avatarId);
    } catch (e) {
        logger.error(e);
        throw new AvatarS3Error("couldn't remove a file in the file storage");
    }

    const { oldAvatarId, ...toReturn } = dbResponse;
    return toReturn;
}
