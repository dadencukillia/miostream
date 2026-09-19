import type { FastifyReply, FastifyRequest } from "fastify";
import "../../context";
import { AvatarError, getAvatar, resetUserAvatar, updateUserAvatarImage } from "./avatar.service";
import { db } from "../../prisma/db";

export const getAvatarController = async (request: FastifyRequest, reply: FastifyReply) => {
  const { avatarId } = request.params as {
    avatarId: string
  };

  try {
    const buffer = await getAvatar(request.server.s3, request.log, avatarId);
    return reply
      .header("content-type", "image/webp")
      .header("cache-control", "public, max-age=31536000, immutable")
      .send(buffer);
  } catch(e) {
    if (e instanceof AvatarError) {
      return reply
        .status(e.status)
        .send({
          ok: false,
          message: e.message,
        });
    }

    request.log.error(e);
    return reply
      .status(500)
      .send({
        ok: false,
        message: "unexpected error",
      });
  }
};

export const resetAvatarController = async (request: FastifyRequest, reply: FastifyReply) => {
  // TODO: replace on working auth middleware context
  const userId = "user";

  try {
    await resetUserAvatar(request.server.s3, db, request.log, userId);
    return reply.send({ ok: true });
  } catch(e) {
    if (e instanceof AvatarError) {
      return reply
        .status(e.status)
        .send({
          ok: false,
          message: e.message,
        });
    }

    request.log.error(e);
    return reply
      .status(500)
      .send({
        ok: false,
        message: "unexpected error",
      });
  }
};

export const updateAvatarController = async (request: FastifyRequest, reply: FastifyReply) => {
  // TODO: replace on working auth middleware context
  const userId = "user";

  try {
    const result = await updateUserAvatarImage(
      request.server.s3, db, 
      request.log, 
      userId, 
      Buffer.from(request.body as string, "base64")
    );

    return reply.send(result);
  } catch(e) {
    if (e instanceof AvatarError) {
      return reply
        .status(e.status)
        .send({
          ok: false,
          message: e.message,
        });
    }

    request.log.error(e);
    return reply
      .status(500)
      .send({
        ok: false,
        message: "unexpected error",
      });
  }
};
