import { Type } from "@sinclair/typebox";
import type { Static } from "@sinclair/typebox";
import type { FastifySchema } from "fastify";

// Primitives

export const AvatarImageSlugParam = Type.Object({
  avatarId: Type.String({ description: "avatar ID" }),
});

export const AvatarErrorResponse = Type.Object({
  ok: Type.Boolean(),
  message: Type.String()
}, {
  examples: [{
    ok: false,
    message: "unexpected error",
  }],
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
    404: AvatarErrorResponse,
    500: AvatarErrorResponse,
  }
};

export type GetAvatarReturnType = Static<typeof AvatarBinaryContentResponse>|Static<typeof AvatarErrorResponse>;

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
    400: AvatarErrorResponse,
    409: AvatarErrorResponse,
    500: AvatarErrorResponse,
  },
};

export type UpdateAvatarReturnType = Static<typeof AvatarUpdatedResponse>|Static<typeof AvatarErrorResponse>;

// Reset avatar

export const resetAvatarSchema: FastifySchema = {
  response: {
    200: AvatarErrorResponse,
    400: AvatarErrorResponse,
    409: AvatarErrorResponse,
    500: AvatarErrorResponse,
  },
};

export type ResetAvatarReturnType = Static<typeof AvatarErrorResponse>|Static<typeof AvatarSuccessResponse>;
