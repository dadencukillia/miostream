import type { FastifyReply, FastifyRequest } from "fastify";
import { getAvatarIdByUserId, setAvatarIdForUser } from "../services/userDatabase.service";
import { db } from "../../../prisma/db";
import { removeAvatarBySlug, setAvatarBySlug } from "../services/avatarBucket.service";
import { processImage } from "../services/image.service";

export const updateAvatarController = async (request: FastifyRequest, reply: FastifyReply) => {
  // TODO: replace on working auth middleware context
  const userId = "user";
  const rustfs = request.server.rustfs;
  const newAvatarId = crypto.randomUUID().replaceAll("-", "");

  // Process image
  const content = Buffer.from(request.body as string, "base64");

  let webpImage: Buffer;
  try {
    webpImage = await processImage(content);
  } catch(e) {
    request.log.error(e);

    return reply
      .status(400)
      .send({
        ok: false,
        message: "invalid image"
      });
  }

  // Get old avatar id
  let avatarId: string|null;
  try {
    avatarId = await getAvatarIdByUserId(db, userId);
  } catch(e) {
    request.log.error(e);

    return reply
      .status(500)
      .send({
        ok: false,
        message: "couldn't receive old avatar data"
      });
  }

  // Store new avatar file
  await setAvatarBySlug(rustfs, newAvatarId, webpImage, {
    async success(_output) {
      reply.send({ 
        ok: true,
        user: userId,
        avatar: newAvatarId,
        format: "webp",
        url: `/cdn/avatar/${newAvatarId}.webp`
      });
    },

    async unknownError(e) {
      request.log.error(e);

      reply
        .status(500)
        .send({ 
          ok: false,
          message: "couldn't store avatar in the file storage",
        });
    }
  });

  // Update avatar in the database
  try {
    const updated = await setAvatarIdForUser(db, userId, avatarId, newAvatarId);
    if (!updated) {
      await removeAvatarBySlug(rustfs, newAvatarId);

      return reply
        .status(409)
        .send({
          ok: false,
          message: "another request is already in process",
        });
    }
  } catch(e) {
    request.log.error(e);
    await removeAvatarBySlug(rustfs, newAvatarId);

    return reply
      .status(500)
      .send({
        ok: false,
        message: "couldn't update avatar in the database",
      });
  }

  // Remove old avatar file
  if (avatarId) {
    try {
      await removeAvatarBySlug(request.server.rustfs, avatarId);
    } catch(e) {
      request.log.error(e);

      return reply
        .status(500)
        .send({ ok: false });
    }
  }
};
