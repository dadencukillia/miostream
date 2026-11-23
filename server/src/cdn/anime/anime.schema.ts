import { Type } from "typebox";
import type { FastifySchema } from "fastify";
import { ErrorResponse } from "@utils/errorsCollection";

const CDN_TAG = "CDN";

export const AnimeIdRequestParams = Type.Object({
  animeId: Type.String({
    format: "uuid",
    description: "Anime ID",
  }),
});

export const AnimeCoverResponse = Type.Any({ description: "Binary format of image/webp" });

export const GetAnimeCoverSchema: FastifySchema = {
  tags: [CDN_TAG],
  summary: "Returns anime cover image in webp format",
  params: AnimeIdRequestParams,
  response: {
    200: AnimeCoverResponse,
    304: Type.Null({ description: "Not modified" }),
    404: ErrorResponse,
    500: ErrorResponse,
  }
};
