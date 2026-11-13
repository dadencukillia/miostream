import Type from "typebox";

export const TAG_LIST = "list";

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
	tags: [TAG_LIST],
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
	tags: [TAG_LIST],
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
	tags: [TAG_LIST],
	summary: "Delete a list unit",
	description: "Permanently removes a list unit for the authenticated user.",
	params: Type.Object({ animeId: Type.String({ format: "uuid" }) }, { additionalProperties: false }),
	response: {
		204: Type.Null(),
		404: ErrorResponse,
		500: ErrorResponse,
	},
} as const;
export const ListUnitStatusFilterEnum = ["finished", "watching", "delayed", "dropped"] as const;

export const GetListUnitsRequestQueries = Type.Object({
	page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
	limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
	status: Type.Optional(StringEnum(LIST_UNIT_STATUSES)),
	sort: Type.Optional(Type.String({ description: "Sort field: startedWatching, grade, title" })),
}, { additionalProperties: false });

export const ListUnitWithAnimeResponse = Type.Object({
	animeId: Type.String({ format: "uuid" }),
	slug: Type.String(),
	titleUa: Type.String(),
	titleEn: Type.String(),
	coverUrl: Type.String(),
	watchedEpisodes: Type.Integer({ minimum: 0 }),
	repeatTimes: Type.Integer({ minimum: 0 }),
	startedWatching: Type.String({ format: "date" }),
	listUnitStatus: StringEnum(LIST_UNIT_STATUSES),
	grade: Type.Union([Type.Integer({ minimum: -5, maximum: 5 }), Type.Null()]),
}, { additionalProperties: false });

export const ListUnitsPageResponse = Type.Object({
	items: Type.Array(ListUnitWithAnimeResponse),
	pagination: Type.Object({
		page: Type.Integer({ minimum: 1 }),
		limit: Type.Integer({ minimum: 1 }),
		total: Type.Integer({ minimum: 0 }),
		totalPages: Type.Integer({ minimum: 0 }),
	}, { additionalProperties: false }),
}, { additionalProperties: false });

export const getListUnitsSchema = {
	tags: ["list"],
	summary: "Get user anime list",
	description: "Returns a paginated list of anime list units for the specified user.",
	params: Type.Object({ userId: Type.String({ format: "uuid" }) }, { additionalProperties: false }),
	querystring: GetListUnitsRequestQueries,
	response: {
		200: ListUnitsPageResponse,
		400: ErrorResponse,
		500: ErrorResponse,
	},
} as const;
