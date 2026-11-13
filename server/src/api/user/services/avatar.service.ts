import sharp from "sharp";
import type { Pool } from "pg";
import type { FastifyBaseLogger } from "fastify";
import type { S3Client } from "@aws-sdk/client-s3";
import { AvatarErrors, UserErrors } from "../user.errors";
import {
    removeAvatarById,
    setAvatarById
} from "@/cdn/avatar/avatar.shared";
import {
    updateUserAvatarReturningOld
} from "@sqlc/users_sql";
import * as dto from "../user.dto";
import { toUserWithoutOldAvatarModel } from "../user.model";

const AVATAR_WIDTH = 256;
const AVATAR_HEIGHT = 256;
const WEBP_QUALITY = 80;

export async function updateUserAvatarImage(
    s3: S3Client,
    db: Pool,
    logger: FastifyBaseLogger,
    userId: string,
    imageContent: Buffer
): Promise<dto.UserResponseType> {
    const newAvatarId = crypto.randomUUID();

    // Process image

    let webpImage: Buffer;

    try {
        webpImage = await sharp(imageContent)
            .resize(AVATAR_WIDTH, AVATAR_HEIGHT, { fit: "cover" })
            .webp({ quality: WEBP_QUALITY })
            .toBuffer();
    } catch (e) {
        logger.error(e);
        throw AvatarErrors.error("invalid-image").withDetails(e);
    }

    // Store new avatar file

    try {
        await setAvatarById(s3, newAvatarId, webpImage);
    } catch (e) {
        logger.error(e);
        throw AvatarErrors.error("new-avatar-s3-store").withDetails(e);
    }

    // Update avatar in the database

    let dbResponse;
    {
        try {
            dbResponse = await updateUserAvatarReturningOld(db, {
                userId: userId,
                newAvatarId: newAvatarId
            });
        } catch (e) {
            logger.error(e);
            await removeAvatarById(s3, newAvatarId);
            throw AvatarErrors.error("update-avatar-db").withDetails(e);
        }

        if (dbResponse == null) {
            await removeAvatarById(s3, newAvatarId);
            throw UserErrors.error("user-not-found");
        }
    }

    // Remove old avatar file

    if (dbResponse.oldAvatarId) {
        try {
            await removeAvatarById(s3, dbResponse.oldAvatarId);
        } catch (e) {
            logger.error(e);
            throw AvatarErrors.error("avatar-s3-remove").withDetails(e);
        }
    }

    return toUserWithoutOldAvatarModel(dbResponse);
}

export async function resetUserAvatar(
    s3: S3Client,
    db: Pool,
    logger: FastifyBaseLogger,
    userId: string
): Promise<dto.UserResponseType> {
    // Update avatar id in database, return old

    let dbResponse;

    try {
        dbResponse = await updateUserAvatarReturningOld(db, {
            userId: userId,
            newAvatarId: null
        });
    } catch (e) {
        logger.error(e);
        throw AvatarErrors.error("update-avatar-db").withDetails(e);
    }

    if (dbResponse == null) {
        throw UserErrors.error("user-not-found");
    }

    if (dbResponse.oldAvatarId == null) {
        throw AvatarErrors.error("already-no-avatar");
    }

    // Remove old avatar image file in S3

    try {
        await removeAvatarById(s3, dbResponse.oldAvatarId);
    } catch (e) {
        logger.error(e);
        throw AvatarErrors.error("avatar-s3-remove").withDetails(e);
    }

    return toUserWithoutOldAvatarModel(dbResponse);
}