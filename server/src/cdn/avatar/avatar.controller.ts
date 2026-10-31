import { type FastifyReply, type FastifyRequest } from "fastify";
import "../../context";
import { getAvatar, resetUserAvatar, updateUserAvatarImage } from "./avatar.service";
import {
  AvatarImageSlugParam,
  GetAvatarReturnType,
  ResetAvatarReturnType,
  UpdateAvatarReturnType
} from "./avatar.schema";
import type { Static } from "@sinclair/typebox";

export const getAvatarController = async (
  request: FastifyRequest<{ Params: Static<typeof AvatarImageSlugParam> }>,
  reply: FastifyReply<{ Params: Static<typeof AvatarImageSlugParam>, Reply: GetAvatarReturnType }>
) => {
  const { avatarId } = request.params;

  const buffer = await getAvatar(request.server.s3, request.log, avatarId);
  return reply
    .header("content-type", "image/webp")
    .header("cache-control", "public, max-age=31536000, immutable")
    .send(buffer);
};

export const updateAvatarController = async (
  request: FastifyRequest<{ Body: string }>,
  reply: FastifyReply<{ Body: string, Reply: UpdateAvatarReturnType }>
) => {
  // TODO: replace on working auth middleware context
  const userId = "844bb852-bd3a-46d8-8062-a4e43b34f454";

  const result = await updateUserAvatarImage(
    request.server.s3, request.server.pg, 
    request.log, 
    userId, 
    Buffer.from(request.body, "base64")
  );

  return reply.send(result);
};

export const resetAvatarController = async (
  request: FastifyRequest<{}>,
  reply: FastifyReply<{ Reply: ResetAvatarReturnType }>
) => {
  // TODO: replace on working auth middleware context
  const userId = "844bb852-bd3a-46d8-8062-a4e43b34f454";

  await resetUserAvatar(request.server.s3, request.server.pg, request.log, userId);
  return reply.send({ ok: true });
};
