import { Type } from "typebox";
import { DateTimeType, Nullable, StringEnum, UuidType } from "@utils/types";
import { ErrorResponse } from "@utils/errorsCollection";
import {
    ANIME_FORMATS,
    ANIME_STATUSES,
    GENRES,
    MPAA_RATINGS,
} from "@/api/anime/anime.schema";

export const TAG_SCHEDULE = "Schedule";

const UtcDateTimeType = Type.Unsafe<Date | string>(Type.String({
    format: "date-time",
    pattern: "Z$",
    description: "ISO 8601 timestamp in UTC (must end with Z)",
    examples: ["2026-11-26T10:00:00.000Z"]
}));

const CalendarDateType = Type.String({
    pattern: "^\\d{4}-\\d{2}-\\d{2}$",
    description: "Calendar date in YYYY-MM-DD format",
    examples: ["2026-11-26"]
});

export const CreateUpcomingEpisodeRequestPayload = Type.Object({
    animeId: UuidType({ description: "Anime UUID" }),
    episodeName: Type.String({
        minLength: 1,
        maxLength: 200,
        description: "Episode name/title"
    }),
    episodeDate: UtcDateTimeType
}, {
    additionalProperties: false,
    description: "Payload for creating an upcoming episode in the schedule"
});

export const UpcomingEpisodeResponse = Type.Object({
    ok: Type.Literal(true, { description: "Indicates a successful operation" }),
    upcomingEpisodeId: UuidType({ description: "Upcoming episode UUID" }),
    animeId: UuidType({ description: "Anime UUID" }),
    episodeName: Type.String({ description: "Episode name/title" }),
    episodeDate: DateTimeType
}, {
    additionalProperties: false,
    description: "Created upcoming episode"
});

export const ScheduleAnime = Type.Object({
    animeId: UuidType({ description: "Anime UUID" }),
    slug: Type.String({ description: "URL-friendly anime slug" }),
    titleUa: Type.String({ description: "Anime title in Ukrainian" }),
    titleEn: Type.String({ description: "Anime title in English" }),
    titleOriginal: Type.String({ description: "Original anime title" }),
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
    genres: Type.Array(StringEnum(GENRES), {
        uniqueItems: true,
        maxItems: 60,
        description: "Anime genres"
    })
}, {
    additionalProperties: false,
    description: "Anime data attached to a schedule entry"
});

export const UpcomingEpisodeItem = Type.Object({
    upcomingEpisodeId: UuidType({ description: "Upcoming episode UUID" }),
    episodeName: Type.String({ description: "Episode name/title" }),
    episodeDate: DateTimeType,
    anime: ScheduleAnime
}, {
    additionalProperties: false,
    description: "Upcoming episode with its anime"
});

export const GetUpcomingEpisodesResponse = Type.Object({
    ok: Type.Literal(true, { description: "Indicates a successful operation" }),
    items: Type.Array(UpcomingEpisodeItem, { description: "Upcoming episodes for the requested calendar date" })
}, {
    additionalProperties: false,
    description: "Schedule for a calendar date"
});

export const GetUpcomingEpisodesRequestQueries = Type.Object({
    date: CalendarDateType
}, {
    additionalProperties: false,
    description: "Calendar date to load the schedule for"
});

export const CreateUpcomingEpisodeSchema = {
    tags: [TAG_SCHEDULE],
    summary: "Create upcoming episode",
    description: "Creates an upcoming episode in the schedule. episodeDate must be an ISO 8601 UTC timestamp ending with Z.",
    body: CreateUpcomingEpisodeRequestPayload,
    response: {
        201: UpcomingEpisodeResponse,
        400: ErrorResponse,
        404: ErrorResponse,
        409: ErrorResponse,
        500: ErrorResponse,
    },
} as const;

export const GetUpcomingEpisodesSchema = {
    tags: [TAG_SCHEDULE],
    summary: "Get schedule for a date",
    description: "Returns upcoming episodes for a calendar date with attached anime data. The UTC window is widened by -14h/+12h to cover all time zones.",
    querystring: GetUpcomingEpisodesRequestQueries,
    response: {
        200: GetUpcomingEpisodesResponse,
        400: ErrorResponse,
        500: ErrorResponse,
    },
} as const;
