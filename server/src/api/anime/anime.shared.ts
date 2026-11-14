import Type from "typebox";

export const AnimeId = Type.String({
  format: "uuid",
  description: "Anime UUID",
  examples: ["018f23ab-1234-7123-8123-123456789abc"]
});

export type AnimeIdType = Type.Static<typeof AnimeId>;
