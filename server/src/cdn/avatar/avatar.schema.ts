import { Type } from "typebox";
import type { FastifySchema } from "fastify";
import { ErrorResponse } from "@utils/errorsCollection";

// Get Avatar

export const AvatarIdRequestParams = Type.Object({
  avatarId: Type.String({
    format: "uuid",
    description: "avatar ID"
  }),
});

export const AvatarResponse = Type.Any({ description: "binary format of image/webp" });

export const GetAvatarSchema: FastifySchema = {
  tags: ["cdn", "avatar"],
  summary: "loads avatar image",
  params: AvatarIdRequestParams,
  response: {
    200: AvatarResponse,
    404: ErrorResponse,
    500: ErrorResponse,
  }
};
