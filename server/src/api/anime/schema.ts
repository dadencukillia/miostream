import Type, { type TSchema, type TSchemaOptions } from "typebox";

export const ANIME_FORMATS = [
	"tv",
	"ova",
	"ona",
	"movie",
	"special",
	"music",
	"other",
] as const;

export const ANIME_STATUSES = [
	"upcoming",
	"ongoing",
	"cancelled",
	"finished",
] as const;

export const MPAA_RATINGS =[
	"g",
	"pg",
	"pg13",
	"r",
	"nc17"
] as const;

export const GENRES = [
	"action",
	"adventure",
	"avant_garde",
	"award_winning",
	"boys_love",
	"comedy",
	"drama",
	"fantasy",
	"girls_love",
	"gourmet",
	"horror",
	"mystery",
	"romance",
	"sci_fi",
	"slice_of_life",
	"sports",
	"supernatural",
	"suspense",
	"ecchi",
	"erotica",
	"hentai",
	"adult_cast",
	"anthropomorphic",
	"cgdct",
	"childcare",
	"combat_sports",
	"crossdressing",
	"delinquents",
	"detective",
	"educational",
	"gag_humor",
	"gore",
	"harem",
	"high_stakes_game",
	"historical",
	"idols_female",
	"idols_male",
	"isekai",
	"iyashikei",
	"love_polygon",
	"love_status_quo",
	"fantasy_sex_shift",
	"mahou_shoujo",
	"martial_arts",
	"mecha",
	"medical",
	"military",
	"music",
	"mythology",
	"organized_crime",
	"otaku_culture",
	"parody",
	"performing_arts",
	"pets",
	"psychological",
	"racing",
	"reincarnation",
	"reverse_harem",
	"samurai",
	"school",
	"showbiz",
	"space",
	"strategy_game",
	"super_power",
	"survival",
	"team_sports",
	"time_travel",
	"urban_fantasy",
	"vampire",
	"video_game",
	"villainess",
	"visual_arts",
	"workplace",
	"josei",
	"kids",
	"seinen",
	"shoujo",
	"shounen",
] as const;

export const ANIME_SORTS = [
	"newest",
	"oldest",
	"title",
	"year_desc",
	"year_asc",
] as const;

// Builds a JSON Schema enum that also infers as a union of string literals.
const StringEnum = <T extends readonly string[]>(
	values: T,
	options: TSchemaOptions = {},
) =>
	Type.Unsafe<T[number]>({
		type: "string",
		enum: [...values],
		...options,
	});

const Nullable = <T extends TSchema>(schema: T) =>
	Type.Union([schema, Type.Null()]);

const slugSchema = Type.String({
	minLength: 1,
	maxLength: 200,
	pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
	description: "URL-friendly unique anime identifier, e.g. `sousou-no-frieren`",
});

const genresSchema = Type.Array(StringEnum(GENRES), {
	uniqueItems: true,
	maxItems: 60,
	description: "Anime genres (in the `genres` table)",
});

export const AnimeIdParamsSchema = Type.Object(
	{
		id: Type.String({ format: "uuid", description: "Anime UUID" }),
	},
	{ additionalProperties: false },
);

export const AnimeSlugParamsSchema = Type.Object(
	{
		slug: Type.String({
			minLength: 1,
			maxLength: 200,
			pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
		}),
	},
	{ additionalProperties: false },
);

export const AnimeSchema = Type.Object(
	{
		anime_id: Type.String({ format: "uuid" }),
		slug: Type.String(),
		title_ua: Type.String(),
		title_en: Type.String(),
		title_original: Type.String(),
		anime_description: Type.String(),
		cover_url: Type.String(),
		production_studio: Type.String(),
		mal_id: Nullable(Type.Integer()),
		anilist_id: Nullable(Type.Integer()),
		hikka_id: Nullable(Type.String()),
		imdb_id: Nullable(Type.String()),
		year_released: Nullable(Type.Integer()),
		avg_episode_duration: Type.Integer({ minimum: 0 }),
		episodes_count: Type.Integer({ minimum: 0 }),
		age_restriction: Nullable(StringEnum(MPAA_RATINGS)),
		anime_status: Nullable(StringEnum(ANIME_STATUSES)),
		anime_format: StringEnum(ANIME_FORMATS),
		available: Type.Boolean(),
		genres: Type.Array(StringEnum(GENRES)),
	},
	{ additionalProperties: false },
);

export const CreateAnimeBodySchema = Type.Object(
	{
		slug: slugSchema,
		title_ua: Type.Optional(Type.String({ minLength: 1, maxLength: 400 })),
		title_en: Type.Optional(Type.String({ maxLength: 400 })),
		title_original: Type.Optional(Type.String({ maxLength: 400 })),
		anime_description: Type.Optional(Type.String()),
		cover_url: Type.Optional(Type.String({ maxLength: 2048 })),
		production_studio: Type.Optional(Type.String({ maxLength: 255 })),
		mal_id: Type.Optional(Nullable(Type.Integer({ minimum: 1 }))),
		anilist_id: Type.Optional(Nullable(Type.Integer({ minimum: 1 }))),
		hikka_id: Type.Optional(Nullable(Type.String({ maxLength: 64 }))),
		imdb_id: Type.Optional(Nullable(Type.String({ maxLength: 32 }))),
		year_released: Type.Optional(
			Nullable(Type.Integer({ minimum: 1900})),
		),
		avg_episode_duration: Type.Optional(
			Type.Integer({ minimum: 0}),
		),
		episodes_count: Type.Optional(Type.Integer({ minimum: 0})),
		age_restriction: Type.Optional(Nullable(StringEnum(MPAA_RATINGS))),
		anime_status: Type.Optional(Nullable(StringEnum(ANIME_STATUSES))),
		anime_format: Type.Optional(StringEnum(ANIME_FORMATS)),
		available: Type.Optional(Type.Boolean()),
		genres: Type.Optional(genresSchema),
	},
	{ additionalProperties: false },
);

/**
 * PATCH uses the same fields as POST, but every field becomes optional.
 * Service additionally rejects an empty patch object.
 */
export const UpdateAnimeBodySchema = Type.Partial(CreateAnimeBodySchema, {
	additionalProperties: false,
});

export const ListAnimesQuerySchema = Type.Object(
	{
		page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
		limit: Type.Optional(
			Type.Integer({ minimum: 1, maximum: 100, default: 20 }),
		),
		search: Type.Optional(
			Type.String({
				minLength: 1,
				maxLength: 200,
				description: "Case-insensitive search by slug or any title",
			}),
		),
		genre: Type.Optional(StringEnum(GENRES)),
		status: Type.Optional(StringEnum(ANIME_STATUSES)),
		format: Type.Optional(StringEnum(ANIME_FORMATS)),
		year: Type.Optional(Type.Integer({ minimum: 1900, maximum: 2100 })),
		available: Type.Optional(
			Type.Boolean({
				default: true,
				description: "Defaults to `true`; pass `false` to show hidden animes",
			}),
		),
		sort: Type.Optional(StringEnum(ANIME_SORTS, { default: "newest" })),
	},
	{ additionalProperties: false },
);

export const PaginationSchema = Type.Object(
	{
		page: Type.Integer({ minimum: 1 }),
		limit: Type.Integer({ minimum: 1 }),
		total: Type.Integer({ minimum: 0 }),
		total_pages: Type.Integer({ minimum: 0 }),
	},
	{ additionalProperties: false },
);

export const AnimeListResponseSchema = Type.Object(
	{
		items: Type.Array(AnimeSchema),
		pagination: PaginationSchema,
	},
	{ additionalProperties: false },
);

export const ErrorResponseSchema = Type.Object(
	{
		ok: Type.Literal(false),
		message: Type.String(),
	},
	{ additionalProperties: false },
);

// Route schemas passed directly to Fastify.

export const listAnimesRouteSchema = {
	querystring: ListAnimesQuerySchema,
	response: {
		200: AnimeListResponseSchema,
		400: ErrorResponseSchema,
		500: ErrorResponseSchema,
	},
} as const;

export const getAnimeRouteSchema = {
	params: AnimeIdParamsSchema,
	response: {
		200: AnimeSchema,
		400: ErrorResponseSchema,
		404: ErrorResponseSchema,
		500: ErrorResponseSchema,
	},
} as const;

export const getAnimeBySlugRouteSchema = {
	params: AnimeSlugParamsSchema,
	response: {
		200: AnimeSchema,
		400: ErrorResponseSchema,
		404: ErrorResponseSchema,
		500: ErrorResponseSchema,
	},
} as const;

export const createAnimeRouteSchema = {
	body: CreateAnimeBodySchema,
	response: {
		201: AnimeSchema,
		400: ErrorResponseSchema,
		409: ErrorResponseSchema,
		500: ErrorResponseSchema,
	},
} as const;

export const updateAnimeRouteSchema = {
	params: AnimeIdParamsSchema,
	body: UpdateAnimeBodySchema,
	response: {
		200: AnimeSchema,
		400: ErrorResponseSchema,
		404: ErrorResponseSchema,
		409: ErrorResponseSchema,
		500: ErrorResponseSchema,
	},
} as const;

export const deleteAnimeRouteSchema = {
	params: AnimeIdParamsSchema,
	response: {
		204: Type.Null(),
		400: ErrorResponseSchema,
		404: ErrorResponseSchema,
		500: ErrorResponseSchema,
	},
} as const;