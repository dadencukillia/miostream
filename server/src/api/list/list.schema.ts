import Type from "typebox";

export const LIST_UNIT_STATUSES = ["finished", "watching", "delayed", "dropped"] as const;

const StringEnum = <T extends readonly string[]>(values: T) =>
	Type.Unsafe<T[number]>({ type: "string", enum: [...values] });

export const CreateListUnitRequestPayload = Type.Object(
	{
		animeId: Type.String({ format: "uuid", description: "Anime UUID" }),
		watchedEpisodes: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
		repeatTimes: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
		startedWatching: Type.Optional(Type.String({ format: "date", description: "Start date YYYY-MM-DD" })),
		listUnitStatus: Type.Optional(StringEnum(LIST_UNIT_STATUSES)),
		grade: Type.Optional(Type.Union([Type.Integer({ minimum: -5, maximum: 5 }), Type.Null()])),
	},
	{ additionalProperties: false },
);

export const ListUnitResponse = Type.Object(
	{
		userId: Type.String({ format: "uuid" }),
		animeId: Type.String({ format: "uuid" }),
		watchedEpisodes: Type.Integer({ minimum: 0 }),
		repeatTimes: Type.Integer({ minimum: 0 }),
		startedWatching: Type.String({ format: "date" }),
		listUnitStatus: StringEnum(LIST_UNIT_STATUSES),
		grade: Type.Union([Type.Integer({ minimum: -5, maximum: 5 }), Type.Null()]),
	},
	{ additionalProperties: false },
);

export const ErrorResponse = Type.Object(
	{
		ok: Type.Literal(false),
		message: Type.String(),
	},
	{ additionalProperties: false },
);

export const CreateListUnitSchema = {
	tags: ["list"],
	summary: "Create a list unit",
	description: "Creates a list unit for the authenticated user. Defaults are applied for missing fields.",
	body: CreateListUnitRequestPayload,
	response: {
		201: ListUnitResponse,
		400: ErrorResponse,
		409: ErrorResponse,
		500: ErrorResponse,
	},
} as const;
export const UpdateListUnitRequestPayload = Type.Object(
	{
		watchedEpisodes: Type.Optional(Type.Integer({ minimum: 0 })),
		repeatTimes: Type.Optional(Type.Integer({ minimum: 0 })),
		startedWatching: Type.Optional(Type.String({ format: "date" })),
		listUnitStatus: Type.Optional(StringEnum(LIST_UNIT_STATUSES)),
		grade: Type.Optional(Type.Union([Type.Integer({ minimum: -5, maximum: 5 }), Type.Null()])),
	},
	{ additionalProperties: false },
);

export const UpdateListUnitSchema = {
	tags: ["list"],
	summary: "Update a list unit",
	description: "Updates fields of a list unit for the authenticated user. Omitted fields are unchanged.",
	params: Type.Object({ animeId: Type.String({ format: "uuid" }) }, { additionalProperties: false }),
	body: UpdateListUnitRequestPayload,
	response: {
		200: ListUnitResponse,
		400: ErrorResponse,
		404: ErrorResponse,
		500: ErrorResponse,
	},
} as const;

export const DeleteListUnitSchema = {
	tags: ["list"],
	summary: "Delete a list unit",
	description: "Permanently removes a list unit for the authenticated user.",
	params: Type.Object({ animeId: Type.String({ format: "uuid" }) }, { additionalProperties: false }),
	response: {
		204: Type.Null(),
		404: ErrorResponse,
		500: ErrorResponse,
	},
} as const;