import type { Client } from "pg";

export const createListUnitQuery = `-- name: CreateListUnit :one
INSERT INTO public.anime_list_units (
    user_id,
    anime_id,
    watched_episodes,
    repeat_times,
    started_watching,
    list_unit_status,
    grade
) VALUES (
    $1::uuid,
    $2::uuid,
    $3::int,
    $4::int,
    $5::date,
    $6::anime_list_unit_status_enum,
    $7::smallint
) RETURNING
    user_id,
    anime_id,
    watched_episodes,
    repeat_times,
    started_watching,
    list_unit_status,
    grade`;

export interface CreateListUnitArgs {
    userId: string;
    animeId: string;
    watchedEpisodes: number;
    repeatTimes: number;
    startedWatching: string;
    listUnitStatus: string;
    grade: number | null;
}

export interface CreateListUnitRow {
    userId: string;
    animeId: string;
    watchedEpisodes: number;
    repeatTimes: number;
    startedWatching: string;
    listUnitStatus: string;
    grade: number | null;
}

export async function createListUnit(client: Client, args: CreateListUnitArgs): Promise<CreateListUnitRow> {
    const result = await client.query({
        text: createListUnitQuery,
        values: [args.userId, args.animeId, args.watchedEpisodes, args.repeatTimes, args.startedWatching, args.listUnitStatus, args.grade],
        rowMode: "array",
    });
    const row = result.rows[0];
    return {
        userId: row[0],
        animeId: row[1],
        watchedEpisodes: row[2],
        repeatTimes: row[3],
        startedWatching: row[4],
        listUnitStatus: row[5],
        grade: row[6],
    };
}
