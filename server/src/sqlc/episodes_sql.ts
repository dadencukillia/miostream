import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const episodesListByAnimeIdQuery = `-- name: EpisodesListByAnimeId :many
SELECT episode_id, episode_name, localization_studio, localization_type
FROM public.episodes
WHERE
  anime_id = $1::uuid
ORDER BY order_index ASC, episode_id ASC`;

export interface EpisodesListByAnimeIdArgs {
    animeId: string;
}

export interface EpisodesListByAnimeIdRow {
    episodeId: string;
    episodeName: string;
    localizationStudio: string;
    localizationType: string | null;
}

export async function episodesListByAnimeId(client: Client, args: EpisodesListByAnimeIdArgs): Promise<EpisodesListByAnimeIdRow[]> {
    const result = await client.query({
        text: episodesListByAnimeIdQuery,
        values: [args.animeId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            episodeId: row[0],
            episodeName: row[1],
            localizationStudio: row[2],
            localizationType: row[3]
        };
    });
}

export const episodeByIdQuery = `-- name: EpisodeById :one
SELECT anime_id, source_url, episode_name, localization_studio, localization_type
FROM public.episodes
WHERE episode_id = $1::bigint
  AND anime_id = $2::uuid`;

export interface EpisodeByIdArgs {
    episodeId: string;
    animeId: string;
}

export interface EpisodeByIdRow {
    animeId: string;
    sourceUrl: string;
    episodeName: string;
    localizationStudio: string;
    localizationType: string | null;
}

export async function episodeById(client: Client, args: EpisodeByIdArgs): Promise<EpisodeByIdRow | null> {
    const result = await client.query({
        text: episodeByIdQuery,
        values: [args.episodeId, args.animeId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        animeId: row[0],
        sourceUrl: row[1],
        episodeName: row[2],
        localizationStudio: row[3],
        localizationType: row[4]
    };
}

export const createEpisodeQuery = `-- name: CreateEpisode :one
INSERT INTO public.episodes(anime_id, source_url, episode_name, localization_studio, localization_type, order_index)
VALUES(
  $1, $2, $3, $4, $5,
  (SELECT coalesce(max(order_index), 0) + 100 FROM public.episodes WHERE anime_id = $1)
)
RETURNING episode_id, anime_id, source_url, episode_name, localization_studio, localization_type, order_index, preview_id`;

export interface CreateEpisodeArgs {
    animeId: string;
    sourceUrl: string;
    episodeName: string;
    localizationStudio: string;
    localizationType: string | null;
}

export interface CreateEpisodeRow {
    episodeId: string;
    animeId: string;
    sourceUrl: string;
    episodeName: string;
    localizationStudio: string;
    localizationType: string | null;
    orderIndex: number;
    previewId: string | null;
}

export async function createEpisode(client: Client, args: CreateEpisodeArgs): Promise<CreateEpisodeRow | null> {
    const result = await client.query({
        text: createEpisodeQuery,
        values: [args.animeId, args.sourceUrl, args.episodeName, args.localizationStudio, args.localizationType],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        episodeId: row[0],
        animeId: row[1],
        sourceUrl: row[2],
        episodeName: row[3],
        localizationStudio: row[4],
        localizationType: row[5],
        orderIndex: row[6],
        previewId: row[7]
    };
}

export const putEpisodeQuery = `-- name: PutEpisode :one
UPDATE public.episodes
SET
  source_url = $1,
  episode_name = $2,
  localization_studio = $3,
  localization_type = $4
WHERE
  episode_id = $5::bigint
  AND anime_id = $6::uuid
RETURNING episode_id, anime_id, source_url, episode_name, localization_studio, localization_type, order_index, preview_id`;

export interface PutEpisodeArgs {
    newSourceUrl: string;
    newEpisodeName: string;
    newLocalizationStudio: string;
    newLocalizationType: string | null;
    episodeId: string;
    animeId: string;
}

export interface PutEpisodeRow {
    episodeId: string;
    animeId: string;
    sourceUrl: string;
    episodeName: string;
    localizationStudio: string;
    localizationType: string | null;
    orderIndex: number;
    previewId: string | null;
}

export async function putEpisode(client: Client, args: PutEpisodeArgs): Promise<PutEpisodeRow | null> {
    const result = await client.query({
        text: putEpisodeQuery,
        values: [args.newSourceUrl, args.newEpisodeName, args.newLocalizationStudio, args.newLocalizationType, args.episodeId, args.animeId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        episodeId: row[0],
        animeId: row[1],
        sourceUrl: row[2],
        episodeName: row[3],
        localizationStudio: row[4],
        localizationType: row[5],
        orderIndex: row[6],
        previewId: row[7]
    };
}

export const reorderEpisodesQuery = `-- name: ReorderEpisodes :exec
UPDATE public.episodes e
SET order_index = sub.rn * 100
FROM (
  SELECT episode_id,
         ROW_NUMBER() OVER (ORDER BY order_index, episode_id) AS rn
  FROM public.episodes
  WHERE anime_id = $1::uuid
) sub
WHERE e.episode_id = sub.episode_id
  AND e.anime_id = $1::uuid`;

export interface ReorderEpisodesArgs {
    animeId: string;
}

export async function reorderEpisodes(client: Client, args: ReorderEpisodesArgs): Promise<void> {
    await client.query({
        text: reorderEpisodesQuery,
        values: [args.animeId],
        rowMode: "array"
    });
}

export const episodeSetAfterQuery = `-- name: EpisodeSetAfter :one
UPDATE public.episodes
SET order_index = CASE
  WHEN $1::bigint IS NULL THEN 0
  ELSE (
    SELECT p.order_index + 50
    FROM public.episodes p
    WHERE p.episode_id = $1::bigint
      AND p.anime_id = $2::uuid
  )
END
WHERE episode_id = $3::bigint
  AND anime_id = $2::uuid
  AND episode_id IS DISTINCT FROM $1::bigint
  AND (
    $1::bigint IS NULL
    OR EXISTS (
      SELECT 1 FROM public.episodes p
      WHERE p.episode_id = $1::bigint
        AND p.anime_id = $2::uuid
    )
  )
RETURNING episode_id, order_index`;

export interface EpisodeSetAfterArgs {
    prevEpisodeId: string | null;
    animeId: string;
    episodeId: string;
}

export interface EpisodeSetAfterRow {
    episodeId: string;
    orderIndex: number;
}

export async function episodeSetAfter(client: Client, args: EpisodeSetAfterArgs): Promise<EpisodeSetAfterRow | null> {
    const result = await client.query({
        text: episodeSetAfterQuery,
        values: [args.prevEpisodeId, args.animeId, args.episodeId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        episodeId: row[0],
        orderIndex: row[1]
    };
}

export const deleteEpisodeByIdQuery = `-- name: DeleteEpisodeById :one
DELETE FROM public.episodes
WHERE episode_id = $1::bigint
  AND anime_id = $2::uuid
RETURNING 1::integer AS success_flag`;

export interface DeleteEpisodeByIdArgs {
    episodeId: string;
    animeId: string;
}

export interface DeleteEpisodeByIdRow {
    successFlag: number;
}

export async function deleteEpisodeById(client: Client, args: DeleteEpisodeByIdArgs): Promise<DeleteEpisodeByIdRow | null> {
    const result = await client.query({
        text: deleteEpisodeByIdQuery,
        values: [args.episodeId, args.animeId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        successFlag: row[0]
    };
}

export const lockAnimeEpisodesQuery = `-- name: LockAnimeEpisodes :exec
SELECT pg_advisory_xact_lock(hashtextextended(($1::uuid)::text, 0))`;

export interface LockAnimeEpisodesArgs {
    animeId: string;
}

export interface LockAnimeEpisodesRow {
    pgAdvisoryXactLock: string;
}

export async function lockAnimeEpisodes(client: Client, args: LockAnimeEpisodesArgs): Promise<void> {
    await client.query({
        text: lockAnimeEpisodesQuery,
        values: [args.animeId],
        rowMode: "array"
    });
}

export const resetEpisodePreviewReturningOldQuery = `-- name: ResetEpisodePreviewReturningOld :one
WITH old_vals AS (
  SELECT preview_id, episode_id
  FROM public.episodes
  WHERE "episode_id" = $1::bigint
    AND "anime_id" = $2::uuid
  FOR UPDATE
) UPDATE public.episodes e
SET
  "preview_id" = NULL
FROM old_vals o
WHERE e.episode_id = o.episode_id
RETURNING
  o."episode_id",
  o."preview_id" AS old_preview_id`;

export interface ResetEpisodePreviewReturningOldArgs {
    episodeId: string;
    animeId: string;
}

export interface ResetEpisodePreviewReturningOldRow {
    episodeId: string;
    oldPreviewId: string | null;
}

export async function resetEpisodePreviewReturningOld(client: Client, args: ResetEpisodePreviewReturningOldArgs): Promise<ResetEpisodePreviewReturningOldRow | null> {
    const result = await client.query({
        text: resetEpisodePreviewReturningOldQuery,
        values: [args.episodeId, args.animeId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        episodeId: row[0],
        oldPreviewId: row[1]
    };
}

