import type { FastifyReply, FastifyRequest } from "fastify";
import "../../../context";
import { getAvatarBySlug } from "../services/avatarBucket.service";

export const getAvatarController = async (request: FastifyRequest, reply: FastifyReply) => {
  const { imageSlug } = request.params as {
    imageSlug: string
  };

  await getAvatarBySlug(request.server.rustfs, imageSlug, {
    async success(output) {
      reply
        .header("content-type", "image/webp")
        .header("cache-control", "public, max-age=31536000, immutable")
        .send(await output!.Body?.transformToByteArray());
    },

    async unknownError(e) {
      request.log.error(e);

      reply
        .status(500)
        .send({
          ok: false,
          message: "couldn't reach the file storage",
        });
    },

    async notFound() {
      reply
        .status(404)
        .send({ ok: false });
    },
  });
};
