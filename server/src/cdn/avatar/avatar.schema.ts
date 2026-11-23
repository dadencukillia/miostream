import { Type } from "typebox";
import type { FastifySchema } from "fastify";
import { ErrorResponse } from "@lib/errorsCollection";

const CDN_TAG = "CDN";

// Get Avatar

export const AvatarIdRequestParams = Type.Object({
  avatarId: Type.String({
    format: "uuid",
    description: "Avatar ID"
  }),
});

export const AvatarResponse = Type.Any({ description: "Binary format of image/webp" });

export const GetAvatarSchema: FastifySchema = {
  tags: [CDN_TAG],
  summary: "Returns avatar image in webp format",
  params: AvatarIdRequestParams,
  response: {
    200: AvatarResponse,
    404: ErrorResponse,
    500: ErrorResponse,
  }
};
