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
)
RETURNING user_id, anime_id, watched_episodes, repeat_times, started_watching, list_unit_status, grade`;

export interface CreateListUnitArgs {
    userId: string;
    animeId: string;
    watchedEpisodes: number;
    repeatTimes: number;
    startedWatching: Date;
    listUnitStatus: string;
    grade: number | null;
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
        values: [args.userId, args.animeId, args.watchedEpisodes, args.repeatTimes, args.startedWatching, args.listUnitStatus, args.grade],
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

export const getListUnitQuery = `-- name: GetListUnit :one
SELECT user_id, anime_id, watched_episodes, repeat_times, started_watching, list_unit_status, grade
FROM public.anime_list_units
WHERE user_id = $1::uuid AND anime_id = $2::uuid`;

export interface GetListUnitArgs {
    userId: string;
    animeId: string;
}

export interface GetListUnitRow {
    userId: string;
    animeId: string;
    watchedEpisodes: number;
    repeatTimes: number;
    startedWatching: Date;
    listUnitStatus: string;
    grade: number | null;
}

export async function getListUnit(client: Client, args: GetListUnitArgs): Promise<GetListUnitRow | null> {
    const result = await client.query({
        text: getListUnitQuery,
        values: [args.userId, args.animeId],
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

export const updateListUnitQuery = `-- name: UpdateListUnit :one
UPDATE public.anime_list_units
SET
    watched_episodes = $1::int,
    repeat_times = $2::int,
    started_watching = $3::date,
    list_unit_status = $4::anime_list_unit_status_enum,
    grade = CASE
        WHEN 'grade' = ANY($5::text[]) THEN NULL
        ELSE COALESCE($6::smallint, grade)
    END
WHERE user_id = $7::uuid AND anime_id = $8::uuid
RETURNING user_id, anime_id, watched_episodes, repeat_times, started_watching, list_unit_status, grade`;

export interface UpdateListUnitArgs {
    watchedEpisodes: number;
    repeatTimes: number;
    startedWatching: Date;
    listUnitStatus: string;
    nullFields: string[];
    grade: number | null;
    userId: string;
    animeId: string;
}

export interface UpdateListUnitRow {
    userId: string;
    animeId: string;
    watchedEpisodes: number;
    repeatTimes: number;
    startedWatching: Date;
    listUnitStatus: string;
    grade: number | null;
}

export async function updateListUnit(client: Client, args: UpdateListUnitArgs): Promise<UpdateListUnitRow | null> {
    const result = await client.query({
        text: updateListUnitQuery,
        values: [args.watchedEpisodes, args.repeatTimes, args.startedWatching, args.listUnitStatus, args.nullFields, args.grade, args.userId, args.animeId],
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

export const deleteListUnitQuery = `-- name: DeleteListUnit :one
DELETE FROM public.anime_list_units
WHERE user_id = $1::uuid AND anime_id = $2::uuid
RETURNING user_id, anime_id, watched_episodes, repeat_times, started_watching, list_unit_status, grade`;

export interface DeleteListUnitArgs {
    userId: string;
    animeId: string;
}

export interface DeleteListUnitRow {
    userId: string;
    animeId: string;
    watchedEpisodes: number;
    repeatTimes: number;
    startedWatching: Date;
    listUnitStatus: string;
    grade: number | null;
}

export async function deleteListUnit(client: Client, args: DeleteListUnitArgs): Promise<DeleteListUnitRow | null> {
    const result = await client.query({
        text: deleteListUnitQuery,
        values: [args.userId, args.animeId],
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

export const countListUnitsQuery = `-- name: CountListUnits :one
SELECT COUNT(*)::int AS total
FROM public.anime_list_units lu
WHERE lu.user_id = $1::uuid
  AND ($2::anime_list_unit_status_enum IS NULL OR lu.list_unit_status = $2::anime_list_unit_status_enum)`;

export interface CountListUnitsArgs {
    userId: string;
    status: string | null;
}

export interface CountListUnitsRow {
    total: number;
}

export async function countListUnits(client: Client, args: CountListUnitsArgs): Promise<CountListUnitsRow | null> {
    const result = await client.query({
        text: countListUnitsQuery,
        values: [args.userId, args.status],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        total: row[0]
    };
}

export const listListUnitsQuery = `-- name: ListListUnits :many
SELECT
    lu.anime_id,
    a.slug,
    a.title_ua,
    a.title_en,
    a.cover_id,
    lu.watched_episodes,
    lu.repeat_times,
    lu.started_watching,
    lu.list_unit_status,
    lu.grade
FROM public.anime_list_units lu
JOIN public.animes a ON a.anime_id = lu.anime_id
WHERE lu.user_id = $1::uuid
  AND ($2::anime_list_unit_status_enum IS NULL OR lu.list_unit_status = $2::anime_list_unit_status_enum)
ORDER BY
    CASE WHEN $3::text = 'grade' THEN lu.grade END DESC NULLS LAST,
    CASE WHEN $3::text = 'startedWatching' THEN lu.started_watching END DESC,
    a.title_ua ASC
LIMIT $5::int OFFSET $4::int`;

export interface ListListUnitsArgs {
    userId: string;
    status: string | null;
    sort: string;
    offset: number;
    limit: number;
}

export interface ListListUnitsRow {
    animeId: string;
    slug: string;
    titleUa: string;
    titleEn: string;
    coverId: string | null;
    watchedEpisodes: number;
    repeatTimes: number;
    startedWatching: Date;
    listUnitStatus: string;
    grade: number | null;
}

export async function listListUnits(client: Client, args: ListListUnitsArgs): Promise<ListListUnitsRow[]> {
    const result = await client.query({
        text: listListUnitsQuery,
        values: [args.userId, args.status, args.sort, args.offset, args.limit],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            animeId: row[0],
            slug: row[1],
            titleUa: row[2],
            titleEn: row[3],
            coverId: row[4],
            watchedEpisodes: row[5],
            repeatTimes: row[6],
            startedWatching: row[7],
            listUnitStatus: row[8],
            grade: row[9]
        };
    });
}

