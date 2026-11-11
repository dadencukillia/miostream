import Type from "typebox";

export const AnimeIdParamsSchema = Type.Object(
	{
		id: Type.String({ format: "uuid", description: "Anime UUID" }),
	},
	{
		additionalProperties: false,
		examples: [{ id: "018f23ab-1234-7123-8123-123456789abc" }],
	},
);

export type AnimeIdParamsType = Type.Static<typeof AnimeIdParamsSchema>;