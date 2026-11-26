import type { Pool } from "pg";
import * as scheduleSqlc from "@sqlc/schedule_sql";
import { ScheduleErrors } from "./schedule.errors";
import type * as dto from "./schedule.dto";
import { toUpcomingEpisodeItem } from "./schedule.model";
import { parseCalendarDateToUtcMs } from "@utils/time";

const DB_INVALID_ID_CODES: readonly string[] = ["22P02", "22003"];
const DB_INVALID_INPUT_CODES: readonly string[] = ["23514", "22P02", "22003", "22001"];
const DB_DATA_NOT_FOUND_CODE = "23503";
const DB_UNIQUE_VIOLATION_CODE = "23505";

const MS_PER_HOUR = 3_600_000;
const LOWER_TZ_OFFSET_HOURS = 14;
const UPPER_TZ_OFFSET_HOURS = 12;
const DAY_HOURS = 24;

const resolveUtcWindow = (date: string): { from: Date; to: Date } => {
    const startUtcMs = parseCalendarDateToUtcMs(date.trim());

    if (startUtcMs === null || new Date(startUtcMs).toISOString().slice(0, 10) !== date.trim()) {
        throw ScheduleErrors.error("schedule-invalid-date");
    }

    return {
        from: new Date(startUtcMs - LOWER_TZ_OFFSET_HOURS * MS_PER_HOUR),
        to: new Date(startUtcMs + (DAY_HOURS + UPPER_TZ_OFFSET_HOURS) * MS_PER_HOUR),
    };
};

export const getUpcomingEpisodes = async (
    client: Pool,
    query: dto.GetUpcomingEpisodesRequestQueriesType
): Promise<dto.GetUpcomingEpisodesResponseType> => {
    const { from, to } = resolveUtcWindow(query.date);

    let rows: scheduleSqlc.GetUpcomingEpisodesByDateRow[];

    try {
        rows = await scheduleSqlc.getUpcomingEpisodesByDate(client, { fromDate: from, toDate: to });
    } catch (e: any) {
        throw ScheduleErrors.error("schedule-db-error").withDetails(e);
    }

    return {
        ok: true,
        items: rows.map(toUpcomingEpisodeItem),
    };
};

export const updateUpcomingEpisode = async (
    client: Pool,
    upcomingEpisodeId: string,
    data: dto.UpdateUpcomingEpisodeRequestPayloadType
): Promise<dto.UpcomingEpisodeResponseType> => {
    let updated: scheduleSqlc.UpdateUpcomingEpisodeRow | null;

    const episodeName = data.episodeName === undefined
        ? null
        : data.episodeName.trim();

    if (episodeName === "") {
        throw ScheduleErrors.error("schedule-invalid");
    }

    let episodeDate: Date | null = null;
    if (data.episodeDate !== undefined) {
        episodeDate = new Date(String(data.episodeDate));
        if (Number.isNaN(episodeDate.getTime())) {
            throw ScheduleErrors.error("schedule-invalid");
        }
    }

    try {
        updated = await scheduleSqlc.updateUpcomingEpisode(client, {
            upcomingEpisodeId,
            episodeName,
            episodeDate,
        });
    } catch (e: any) {
        if (e?.code === DB_UNIQUE_VIOLATION_CODE) {
            throw ScheduleErrors.error("schedule-episode-already-exists").withDetails(e);
        }
        if (DB_INVALID_ID_CODES.includes(e?.code) || DB_INVALID_INPUT_CODES.includes(e?.code)) {
            throw ScheduleErrors.error("schedule-db-invalid-error").withDetails(e);
        }
        throw ScheduleErrors.error("schedule-db-error").withDetails(e);
    }

    if (!updated) {
        throw ScheduleErrors.error("schedule-episode-not-found");
    }

    return {
        ok: true,
        upcomingEpisodeId: updated.upcomingEpisodeId,
        animeId: updated.animeId,
        episodeName: updated.episodeName,
        episodeDate: updated.episodeDate,
    };
};

export const deleteUpcomingEpisode = async (
    client: Pool,
    upcomingEpisodeId: string
): Promise<void> => {
    let deleted: scheduleSqlc.DeleteUpcomingEpisodeRow | null;

    try {
        deleted = await scheduleSqlc.deleteUpcomingEpisode(client, { upcomingEpisodeId });
    } catch (e: any) {
        if (DB_INVALID_ID_CODES.includes(e?.code)) {
            throw ScheduleErrors.error("schedule-invalid").withDetails(e);
        }
        throw ScheduleErrors.error("schedule-db-error").withDetails(e);
    }

    if (!deleted) {
        throw ScheduleErrors.error("schedule-episode-not-found");
    }
};

export const createUpcomingEpisode = async (
    client: Pool,
    data: dto.CreateUpcomingEpisodeRequestPayloadType
): Promise<dto.UpcomingEpisodeResponseType> => {
    let created: scheduleSqlc.CreateUpcomingEpisodeRow | null;

    const episodeDate = new Date(String(data.episodeDate));
    if (Number.isNaN(episodeDate.getTime())) {
        throw ScheduleErrors.error("schedule-invalid");
    }

    try {
        created = await scheduleSqlc.createUpcomingEpisode(client, {
            animeId: data.animeId,
            episodeName: data.episodeName.trim(),
            episodeDate,
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