import type Type from "typebox";
import type {
    CreateUpcomingEpisodeRequestPayload,
    GetUpcomingEpisodesRequestQueries,
    GetUpcomingEpisodesResponse,
    ScheduleAnime,
    UpcomingEpisodeItem,
    UpcomingEpisodeResponse,
} from "./schedule.schema";

export type CreateUpcomingEpisodeRequestPayloadType = Type.Static<typeof CreateUpcomingEpisodeRequestPayload>;
export type UpcomingEpisodeResponseType = Type.Static<typeof UpcomingEpisodeResponse>;
export type UpcomingEpisodeType = Omit<UpcomingEpisodeResponseType, "ok">;
export type GetUpcomingEpisodesRequestQueriesType = Type.Static<typeof GetUpcomingEpisodesRequestQueries>;
export type GetUpcomingEpisodesResponseType = Type.Static<typeof GetUpcomingEpisodesResponse>;
export type UpcomingEpisodeItemType = Type.Static<typeof UpcomingEpisodeItem>;
export type ScheduleAnimeType = Type.Static<typeof ScheduleAnime>;
