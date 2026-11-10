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

export const AnimeIdRequestParams = Type.Object(
	{
		id: Type.String({ format: "uuid", description: "Anime UUID" }),
	},
	{
		additionalProperties: false,
		examples: [{ id: "018f23ab-1234-7123-8123-123456789abc" }],
	},
);

export const AnimeSlugRequestParams = Type.Object(
	{
		slug: Type.String({
			minLength: 1,
			maxLength: 200,
			pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
			description: "URL-friendly anime slug",
		}),
	},
	{
		additionalProperties: false,
		examples: [{ slug: "sample-anime" }],
	},
);

export const AnimeResponse = Type.Object(
	{
		animeId: Type.String({ format: "uuid", description: "Unique anime identifier (UUID)" }),
		slug: Type.String({ description: "URL-friendly unique anime slug" }),
		titleUa: Type.String({ description: "Anime title in Ukrainian" }),
		titleEn: Type.String({ description: "Anime title in English" }),
		titleOriginal: Type.String({ description: "Original anime title" }),
		animeDescription: Type.String({ description: "Anime synopsis/description" }),
		coverUrl: Type.String({ description: "URL to anime cover image" }),
		productionStudio: Type.String({ description: "Production studio name" }),
		malId: Nullable(Type.Integer({ description: "MyAnimeList ID" })),
		anilistId: Nullable(Type.Integer({ description: "AniList ID" })),
		hikkaId: Nullable(Type.String({ description: "Hikka ID" })),
		imdbId: Nullable(Type.String({ description: "IMDb ID" })),
		yearReleased: Nullable(Type.Integer({ description: "Year of release" })),
		avgEpisodeDuration: Type.Integer({ minimum: 0, description: "Average episode duration in minutes" }),
		episodesCount: Type.Integer({ minimum: 0, description: "Total number of episodes" }),
		ageRestriction: Nullable(StringEnum(MPAA_RATINGS, { description: "MPAA age rating" })),
		animeStatus: Nullable(StringEnum(ANIME_STATUSES, { description: "Anime release status" })),
		animeFormat: StringEnum(ANIME_FORMATS, { description: "Anime format" }),
		available: Type.Boolean({ description: "Whether anime is visible/available" }),
		genres: genresSchema,
	},
	{
		additionalProperties: false,
		description: "Anime catalog entry",
		examples: [
			{
				animeId: "018f23ab-1234-7123-8123-123456789abc",
				slug: "sample-anime",
				titleUa: "Назва",
				titleEn: "Title",
				titleOriginal: "Original",
				animeDescription: "Description",
				coverUrl: "cover",
				productionStudio: "Studio",
				malId: 123,
				anilistId: null,
				hikkaId: null,
				imdbId: null,
				yearReleased: 2020,
				avgEpisodeDuration: 24,
				episodesCount: 12,
				ageRestriction: "pg13",
				animeStatus: "ongoing",
				animeFormat: "tv",
				available: true,
				genres: ["action"],
			},
		],
	},
);

export const CreateAnimeRequestPayload = Type.Object(
	{
		slug: slugSchema,
		titleUa: Type.Optional(Type.String({ minLength: 1, description: "Anime title in Ukrainian" })),
		titleEn: Type.Optional(Type.String({ minLength: 1, description: "Anime title in English" })),
		titleOriginal: Type.Optional(Type.String({ minLength: 1, description: "Original anime title" })),
		animeDescription: Type.Optional(Type.String({ description: "Anime synopsis/description" })),
		coverUrl: Type.Optional(Type.String({ description: "URL to anime cover image" })),
		productionStudio: Type.Optional(Type.String({ description: "Production studio name" })),
		malId: Type.Optional(Nullable(Type.Integer({ minimum: 1 }))),
		anilistId: Type.Optional(Nullable(Type.Integer({ minimum: 1 }))),
		hikkaId: Type.Optional(Nullable(Type.String({ minLength: 1}))),
		imdbId: Type.Optional(Nullable(Type.String({ minLength: 1, maxLength: 32 }))),
		yearReleased: Type.Optional(
			Nullable(Type.Integer({ minimum: 1900 })),
		),
		avgEpisodeDuration: Type.Optional(
			Type.Integer({ minimum: 0}),
		),
		episodesCount: Type.Optional(Type.Integer({ minimum: 0})),
		ageRestriction: Type.Optional(Nullable(StringEnum(MPAA_RATINGS))),
		animeStatus: Type.Optional(Nullable(StringEnum(ANIME_STATUSES))),
		animeFormat: Type.Optional(StringEnum(ANIME_FORMATS)),
		available: Type.Optional(Type.Boolean()),
		genres: Type.Optional(genresSchema),
	},
	{
		additionalProperties: false,
		description: "Payload for creating a new anime entry",
		examples: [
			{
				slug: "sample-anime",
				titleEn: "Title",
				animeFormat: "tv",
				available: true,
				genres: ["action"],
			},
		],
	},
);

/**
 * PATCH uses the same fields as POST, but every field becomes optional.
 * Service additionally rejects an empty patch object.
 */
export const UpdateAnimeRequestPayload = Type.Partial(CreateAnimeRequestPayload, {
	additionalProperties: false,
});

export const ListAnimesRequestQueries = Type.Object(
	{
		page: Type.Optional(Type.Integer({ minimum: 1, default: 1, description: "Page number (1-based)" })),
		limit: Type.Optional(
			Type.Integer({ minimum: 1, maximum: 100, default: 20, description: "Number of items per page" }),
		),
		search: Type.Optional(
			Type.String({
				minLength: 1,
				maxLength: 200,
				description: "Case-insensitive search by slug or any title",
			}),
		),
		genre: Type.Optional(StringEnum(GENRES, { description: "Filter by genre" })),
		status: Type.Optional(StringEnum(ANIME_STATUSES, { description: "Filter by anime status" })),
		format: Type.Optional(StringEnum(ANIME_FORMATS, { description: "Filter by anime format" })),
		year: Type.Optional(Type.Integer({ minimum: 1900, maximum: 2100, description: "Filter by release year" })),
		available: Type.Optional(
			Type.Boolean({
				default: true,
				description: "Defaults to `true`; pass `false` to show hidden animes",
			}),
		),
		sort: Type.Optional(StringEnum(ANIME_SORTS, { default: "newest", description: "Sort order" })),
	},
	{
		additionalProperties: false,
		description: "Query parameters for listing animes",
		examples: [{ page: 1, limit: 20, search: "frieren", sort: "newest" }],
	},
);

export const PaginationResponse = Type.Object(
	{
		page: Type.Integer({ minimum: 1, description: "Current page number" }),
		limit: Type.Integer({ minimum: 1, description: "Items per page" }),
		total: Type.Integer({ minimum: 0, description: "Total number of items" }),
		total_pages: Type.Integer({ minimum: 0, description: "Total number of pages" }),
	},
	{
		additionalProperties: false,
		description: "Pagination metadata",
		examples: [{ page: 1, limit: 20, total: 1, total_pages: 1 }],
	},
);

export const AnimeListResponse = Type.Object(
	{
		items: Type.Array(AnimeResponse, { description: "List of anime entries" }),
		pagination: PaginationResponse,
	},
	{
		additionalProperties: false,
		description: "Paginated anime list response",
		examples: [
			{
				items: [],
				pagination: { page: 1, limit: 20, total: 0, total_pages: 0 },
			},
		],
	},
);

export const ErrorResponse = Type.Object(
	{
		ok: Type.Literal(false, { description: "Indicates an unsuccessful operation" }),
		message: Type.String({ description: "Human-readable error details" }),
	},
	{
		additionalProperties: false,
		description: "Standard error response payload",
		examples: [{ ok: false, message: "Anime not found" }],
	},
);

// Route schemas passed directly to Fastify.

export const ListAnimesSchema = {
	tags: ["anime"],
	summary: "List animes",
	description: "Returns a paginated list of animes with optional filtering, search and sorting.",
	querystring: ListAnimesRequestQueries,
	response: {
		200: AnimeListResponse,
		400: ErrorResponse,
		500: ErrorResponse,
	},
} as const;

export const GetAnimeSchema = {
	tags: ["anime"],
	summary: "Get anime by id",
	description: "Fetches a single anime by its UUID.",
	params: AnimeIdRequestParams,
	response: {
		200: AnimeResponse,
		400: ErrorResponse,
		404: ErrorResponse,
		500: ErrorResponse,
	},
} as const;

export const GetAnimeBySlugSchema = {
	tags: ["anime"],
	summary: "Get anime by slug",
	description: "Fetches a single anime by its URL-friendly slug.",
	params: AnimeSlugRequestParams,
	response: {
		200: AnimeResponse,
		400: ErrorResponse,
		404: ErrorResponse,
		500: ErrorResponse,
	},
} as const;

export const CreateAnimeSchema = {
	tags: ["anime"],
	summary: "Create anime",
	description: "Creates a new anime entry with the provided data.",
	body: CreateAnimeRequestPayload,
	response: {
		201: AnimeResponse,
		400: ErrorResponse,
		409: ErrorResponse,
		500: ErrorResponse,
	},
} as const;

export const UpdateAnimeSchema = {
	tags: ["anime"],
	summary: "Update anime",
	description: "Updates an existing anime by its UUID.",
	params: AnimeIdRequestParams,
	body: UpdateAnimeRequestPayload,
	response: {
		200: AnimeResponse,
		400: ErrorResponse,
		404: ErrorResponse,
		409: ErrorResponse,
		500: ErrorResponse,
	},
} as const;

export const DeleteAnimeSchema = {
	tags: ["anime"],
	summary: "Delete anime",
	description: "Permanently removes an anime by its UUID.",
	params: AnimeIdRequestParams,
	response: {
		204: Type.Null(),
		400: ErrorResponse,
		404: ErrorResponse,
		500: ErrorResponse,
	},
} as const;