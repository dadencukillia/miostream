import { type FastifyReply, type FastifyRequest } from "fastify";
import "../../context";
import { getAvatar, resetUserAvatar, updateUserAvatarImage } from "./avatar.service";

interface GetAvatarParams {
  avatarId: string,
}

export const getAvatarController = async (
  request: FastifyRequest<{ Params: GetAvatarParams }>,
  reply: FastifyReply
) => {
  const { avatarId } = request.params;

  const buffer = await getAvatar(request.server.s3, request.log, avatarId);
  return reply
    .header("content-type", "image/webp")
    .header("cache-control", "public, max-age=31536000, immutable")
    .send(buffer);
};

export const resetAvatarController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  // TODO: replace on working auth middleware context
  const userId = "user";

  await resetUserAvatar(request.server.s3, request.server.pg, request.log, userId);
  return reply.send({ ok: true });
};

export const updateAvatarController = async (
  request: FastifyRequest<{ Body: string }>,
  reply: FastifyReply
) => {
  // TODO: replace on working auth middleware context
  const userId = "user";

  const result = await updateUserAvatarImage(
    request.server.s3, request.server.pg, 
    request.log, 
    userId, 
    Buffer.from(request.body, "base64")
  );

  return reply.send(result);
};
