import type { FastifyReply, FastifyRequest } from "fastify";
import "@context";
import { getAvatar } from "./avatar.service";
import type * as dtos from "./avatar.dto";

export const getAvatarController = async (
  request: FastifyRequest<{ Params: dtos.AvatarIdRequestParamsType }>,
  reply: FastifyReply<{ Params: dtos.AvatarIdRequestParamsType, Reply: dtos.GetAvatarReturnType }>
) => {
  const { avatarId } = request.params;

  const buffer = await getAvatar(request.server.s3, request.log, avatarId);
  return reply
    .header("content-type", "image/webp")
    .header("cache-control", "public, max-age=31536000, immutable")
    .send(buffer);
};
