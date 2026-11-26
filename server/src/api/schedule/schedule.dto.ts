import type Type from "typebox";
import type {
    CreateUpcomingEpisodeRequestPayload,
    UpcomingEpisodeResponse,
} from "./schedule.schema";

export type CreateUpcomingEpisodeRequestPayloadType = Type.Static<typeof CreateUpcomingEpisodeRequestPayload>;
export type UpcomingEpisodeResponseType = Type.Static<typeof UpcomingEpisodeResponse>;
export type UpcomingEpisodeType = Omit<UpcomingEpisodeResponseType, "ok">;