import { Type, type Static } from "typebox";
import type { FastifySchema } from "fastify";

// Primitives

export const AvatarIdParam = Type.Object({
  avatarId: Type.String({
    format: "uuid",
    description: "avatar ID"
  }),
});

export const AvatarErrorResponse = Type.Object({
  ok: Type.Literal(false),
  message: Type.String()
}, {
  examples: [{
    ok: false,
    message: "unexpected error",
  }],
});

// Get Avatar

export const AvatarBinaryContentResponse = Type.Any({ description: "binary format of image/webp" });

export const getAvatarSchema: FastifySchema = {
  params: AvatarIdParam,
  response: {
    200: AvatarBinaryContentResponse,
    404: AvatarErrorResponse,
    500: AvatarErrorResponse,
  }
};

export type GetAvatarReturnType = Static<typeof AvatarBinaryContentResponse>|Static<typeof AvatarErrorResponse>;
