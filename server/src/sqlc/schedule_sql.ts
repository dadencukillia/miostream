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
    ($3::timestamp AT TIME ZONE 'UTC')
)
RETURNING
    upcoming_episode_id,
    anime_id,
    episode_name,
    episode_date`;

export interface CreateUpcomingEpisodeArgs {
    animeId: string;
    episodeName: string;
    episodeDate: string;
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
    const row = result.rows[0]!;
    return {
        upcomingEpisodeId: row[0],
        animeId: row[1],
        episodeName: row[2],
        episodeDate: row[3]
    };
}
