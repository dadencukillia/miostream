import type Type from "typebox";
import type {
    CreateUpcomingEpisodeRequestPayload,
    UpcomingEpisodeRequestParams,
    GetUpcomingEpisodesRequestQueries,
    GetUpcomingEpisodesResponse,
    ScheduleAnime,
    UpcomingEpisodeItem,
    UpcomingEpisodeResponse,
    UpdateUpcomingEpisodeRequestPayload,
} from "./schedule.schema";

export type CreateUpcomingEpisodeRequestPayloadType = Type.Static<typeof CreateUpcomingEpisodeRequestPayload>;
export type UpcomingEpisodeResponseType = Type.Static<typeof UpcomingEpisodeResponse>;
export type UpcomingEpisodeType = Omit<UpcomingEpisodeResponseType, "ok">;
export type GetUpcomingEpisodesRequestQueriesType = Type.Static<typeof GetUpcomingEpisodesRequestQueries>;
export type UpcomingEpisodeRequestParamsType = Type.Static<typeof UpcomingEpisodeRequestParams>;
export type UpdateUpcomingEpisodeRequestPayloadType = Type.Static<typeof UpdateUpcomingEpisodeRequestPayload>;
export type GetUpcomingEpisodesResponseType = Type.Static<typeof GetUpcomingEpisodesResponse>;
export type UpcomingEpisodeItemType = Type.Static<typeof UpcomingEpisodeItem>;
export type ScheduleAnimeType = Type.Static<typeof ScheduleAnime>;