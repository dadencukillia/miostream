import { Type, type Static } from "@sinclair/typebox";
import type { FastifySchema } from "fastify";
import { ErrorResponse, ErrorResponseReturnType } from "../../utils/errorsCollection";

// Primitives

export const AvatarImageSlugParam = Type.Object({
  avatarId: Type.String({ description: "avatar ID" }),
});

export const AvatarSuccessResponse = Type.Object({
  ok: Type.Boolean()
}, {
  examples: [{
    ok: false,
  }],
});

// Get Avatar

export const AvatarBinaryContentResponse = Type.Any({ description: "binary format of image/webp" });

export const getAvatarSchema: FastifySchema = {
  params: AvatarImageSlugParam,
  response: {
    200: AvatarBinaryContentResponse,
    404: ErrorResponse,
    500: ErrorResponse,
  }
};

export type GetAvatarReturnType = Static<typeof AvatarBinaryContentResponse>|ErrorResponseReturnType;

// Update avatar

export const AvatarUpdatePayload = Type.String({ description: "base64 image content" });

export const AvatarUpdatedResponse = Type.Object({
  ok: Type.Boolean(),
  userId: Type.String(),
  avatarId: Type.String(),
  format: Type.String(),
  url: Type.String({ format: "uri" }),
}, {
  examples: [{
    ok: true,
    userId: "6ede9b3b-3e47-48d2-b7ac-40b84d3b70f3",
    avatarId: "844bb852bd3a46d88062a4e43b34f454",
    format: "webp",
    url: "/cdn/avatar/844bb852bd3a46d88062a4e43b34f454.webp"
  }],
});

export const updateAvatarSchema: FastifySchema = {
  body: AvatarUpdatePayload,
  response: {
    200: AvatarUpdatedResponse,
    400: ErrorResponse,
    409: ErrorResponse,
    500: ErrorResponse,
  },
};

export type UpdateAvatarReturnType = Static<typeof AvatarUpdatedResponse>|ErrorResponseReturnType;

// Reset avatar

export const resetAvatarSchema: FastifySchema = {
  response: {
    200: AvatarSuccessResponse,
    400: ErrorResponse,
    409: ErrorResponse,
    500: ErrorResponse,
  },
};

export type ResetAvatarReturnType = ErrorResponseReturnType|Static<typeof AvatarSuccessResponse>;
