import type { FastifySchema } from "fastify";

export const getSchema: FastifySchema = {
  params: {
    type: "object",
    properties: {
      imageSlug: { type: "string" },
    },
  }
};

export const updateSchema: FastifySchema = {
  body: {
    type: "string",
    contentEncoding: "base64"
  },
  response: {
    200: {
      type: "object",
      properties: {
        ok: { type: "boolean" },
        user: { type: "string" },
        avatar: { type: "string" },
        format: { type: "string" },
        url: { type: "string" },
      },
    },
  },
};

export const resetSchema: FastifySchema = {
  response: {
    default: {
      ok: { type: "boolean" },
    },
  },
};
