import type { FastifyReply, FastifyRequest } from "fastify";
import "../../../context";
import { getAvatarBySlug } from "../services/avatar_bucket.service";

export const getAvatarController = async (request: FastifyRequest, reply: FastifyReply) => {
  const { imageSlug } = request.params as {
    imageSlug: string
  };

  await getAvatarBySlug(request.server.rustfs, imageSlug, {
    async success(output) {
      reply
        .header("content-type", output!.ContentType)
        .header("etag", output!.ETag)
        .send(await output!.Body?.transformToByteArray());
    },

    async unknownError(e) {
      request.server.log.error(e);

      return reply
        .status(500)
        .send({ ok: false });
    },

    async notFound() {
      return reply
        .status(404)
        .send({ ok: false });
    },
  });
};
