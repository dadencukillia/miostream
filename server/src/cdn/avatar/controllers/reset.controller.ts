import type { FastifyReply, FastifyRequest } from "fastify";
import { removeAvatarBySlug } from "../services/avatarBucket.service";
import { getAvatarIdByUserId, setAvatarIdForUser } from "../services/userDatabase.service";
import { db } from "../../../prisma/db";

export const resetAvatarController = async (request: FastifyRequest, reply: FastifyReply) => {
  // TODO: replace on working auth middleware context
  const userId = "user";

  let avatarId: string|null;
  try {
    avatarId = await getAvatarIdByUserId(db, userId);
  } catch(e) {
    request.log.error(e);

    return reply
      .status(500)
      .send({
        ok: false,
        message: "couldn't reach the database",
      });
  }

  if (!avatarId) {
    return reply.send({
      ok: false,
      message: "already no avatar"
    });
  }

  try {
    const changed = await setAvatarIdForUser(db, userId, avatarId, null); 

    if (!changed) {
      return reply
        .status(409)
        .send({
          ok: false,
          message: "another request is already in process",
        });
    }
  } catch(e) {
    request.log.error(e);

    return reply
      .status(500)
      .send({
        ok: false,
        message: "couldn't permit changes in the database",
      });
  }

  await removeAvatarBySlug(request.server.rustfs, avatarId, {
    async success(_output) {
      reply.send({ ok: true });
    },

    async unknownError(e) {
      request.log.error(e);

      reply
        .status(500)
        .send({
          ok: false,
          message: "couldn't access to the file storage",
        });
    },
  });
};
