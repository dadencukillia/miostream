import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

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
    : string;
    : string;
    : number;
    : number;
    : Date;
    : string;
    : number;
}

export interface CreateListUnitRow {
    userId: string;
    animeId: string;
    watchedEpisodes: number;
    repeatTimes: number;
    startedWatching: Date;
    listUnitStatus: string;
    grade: number | null;
}

export async function createListUnit(client: Client, args: CreateListUnitArgs): Promise<CreateListUnitRow | null> {
    const result = await client.query({
        text: createListUnitQuery,
        values: [args., args., args., args., args., args., args.],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        userId: row[0],
        animeId: row[1],
        watchedEpisodes: row[2],
        repeatTimes: row[3],
        startedWatching: row[4],
        listUnitStatus: row[5],
        grade: row[6]
    };
}

