import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createUpcomingEpisodeQuery = `-- name: CreateUpcomingEpisode :one
INSERT INTO public.upcoming_episodes(
    anime_id,
    episode_name,
    episode_date
) VALUES (
    $1::uuid,
    $2::text,
    $3::timestamptz
)
RETURNING
    upcoming_episode_id,
    anime_id,
    episode_name,
    episode_date`;

export interface CreateUpcomingEpisodeArgs {
    animeId: string;
    episodeName: string;
    episodeDate: Date;
}

export interface CreateUpcomingEpisodeRow {
    upcomingEpisodeId: string;
    animeId: string;
    episodeName: string;
    episodeDate: Date;
}

export async function createUpcomingEpisode(client: Client, args: CreateUpcomingEpisodeArgs): Promise<CreateUpcomingEpisodeRow | null> {
    const result = await client.query({
        text: createUpcomingEpisodeQuery,
        values: [args.animeId, args.episodeName, args.episodeDate],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        upcomingEpisodeId: row[0],
        animeId: row[1],
        episodeName: row[2],
        episodeDate: row[3]
    };
}

export const getUpcomingEpisodesByDateQuery = `-- name: GetUpcomingEpisodesByDate :many
SELECT
    ue.upcoming_episode_id,
    ue.episode_name,
    ue.episode_date,
    a.anime_id,
    a.slug,
    a.title_ua,
    a.title_en,
    a.title_original,
    a.cover_id,
    a.production_studio,
    a.mal_id,
    a.anilist_id,
    a.hikka_id,
    a.imdb_id,
    a.year_released,
    a.avg_episode_duration,
    a.episodes_count,
    a.age_restriction,
    a.anime_status,
    a.anime_format,
    ARRAY(
        SELECT g.genre_type
        FROM public.genres g
        WHERE g.anime_id = a.anime_id
        ORDER BY g.genre_type
    )::text[] AS genres
FROM public.upcoming_episodes ue
INNER JOIN public.animes a ON a.anime_id = ue.anime_id
WHERE ue.episode_date >= $1::timestamptz
  AND ue.episode_date < $2::timestamptz
ORDER BY ue.episode_date ASC, ue.upcoming_episode_id ASC`;

export interface GetUpcomingEpisodesByDateArgs {
    fromDate: Date;
    toDate: Date;
}

export interface GetUpcomingEpisodesByDateRow {
    upcomingEpisodeId: string;
    episodeName: string;
    episodeDate: Date;
    animeId: string;
    slug: string;
    titleUa: string;
    titleEn: string;
    titleOriginal: string;
    coverId: string | null;
    productionStudio: string;
    malId: string | null;
    anilistId: string | null;
    hikkaId: string | null;
    imdbId: string | null;
    yearReleased: number | null;
    avgEpisodeDuration: number;
    episodesCount: number;
    ageRestriction: string | null;
    animeStatus: string | null;
    animeFormat: string;
    genres: string[];
}

export async function getUpcomingEpisodesByDate(client: Client, args: GetUpcomingEpisodesByDateArgs): Promise<GetUpcomingEpisodesByDateRow[]> {
    const result = await client.query({
        text: getUpcomingEpisodesByDateQuery,
        values: [args.fromDate, args.toDate],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            upcomingEpisodeId: row[0],
            episodeName: row[1],
            episodeDate: row[2],
            animeId: row[3],
            slug: row[4],
            titleUa: row[5],
            titleEn: row[6],
            titleOriginal: row[7],
            coverId: row[8],
            productionStudio: row[9],
            malId: row[10],
            anilistId: row[11],
            hikkaId: row[12],
            imdbId: row[13],
            yearReleased: row[14],
            avgEpisodeDuration: row[15],
            episodesCount: row[16],
            ageRestriction: row[17],
            animeStatus: row[18],
            animeFormat: row[19],
            genres: row[20]
        };
    });
}

