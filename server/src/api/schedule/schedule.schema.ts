import { Type } from "typebox";
import { DateTimeType, UuidType } from "@utils/types";
import { ErrorResponse } from "@utils/errorsCollection";

export const TAG_SCHEDULE = "Schedule";

const UtcDateTimeType = Type.Unsafe<Date | string>(Type.String({
    format: "date-time",
    pattern: "Z$",
    description: "ISO 8601 timestamp in UTC (must end with Z)",
    examples: ["2026-11-26T10:00:00.000Z"]
}));

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

export const CreateUpcomingEpisodeSchema = {
    tags: [TAG_SCHEDULE],
    summary: "Create upcoming episode",
    description: "Creates an upcoming episode in the schedule",
    body: CreateUpcomingEpisodeRequestPayload,
    response: {
        201: UpcomingEpisodeResponse,
        400: ErrorResponse,
        404: ErrorResponse,
        409: ErrorResponse,
        500: ErrorResponse,
    },
} as const;