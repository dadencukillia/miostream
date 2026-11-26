import type { Pool } from "pg";
import * as scheduleSqlc from "@sqlc/schedule_sql";
import { ScheduleErrors } from "./schedule.errors";
import type * as dto from "./schedule.dto";

const DB_INVALID_ID_CODES: readonly string[] = ["22P02", "22003"];
const DB_INVALID_INPUT_CODES: readonly string[] = ["23514", "22P02", "22003", "22001"];
const DB_DATA_NOT_FOUND_CODE = "23503";
const DB_UNIQUE_VIOLATION_CODE = "23505";

export const createUpcomingEpisode = async (
    client: Pool,
    data: dto.CreateUpcomingEpisodeRequestPayloadType
): Promise<dto.UpcomingEpisodeResponseType> => {
    let created: scheduleSqlc.CreateUpcomingEpisodeRow | null;

    try {
        created = await scheduleSqlc.createUpcomingEpisode(client, {
            animeId: data.animeId,
            episodeName: data.episodeName.trim(),
            episodeDate: String(data.episodeDate),
        });
    } catch (e: any) {
        if (e?.code === DB_DATA_NOT_FOUND_CODE) {
            throw ScheduleErrors.error("schedule-db-data-not-found").withDetails(e);
        }
        if (e?.code === DB_UNIQUE_VIOLATION_CODE) {
            throw ScheduleErrors.error("schedule-episode-already-exists").withDetails(e);
        }
        if (DB_INVALID_ID_CODES.includes(e?.code) || DB_INVALID_INPUT_CODES.includes(e?.code)) {
            throw ScheduleErrors.error("schedule-db-invalid-error").withDetails(e);
        }
        throw ScheduleErrors.error("schedule-db-error").withDetails(e);
    }

    if (!created) {
        throw ScheduleErrors.error("schedule-db-error");
    }

    return {
        ok: true,
        upcomingEpisodeId: created.upcomingEpisodeId,
        animeId: created.animeId,
        episodeName: created.episodeName,
        episodeDate: created.episodeDate,
    };
};