import { Pool } from "pg";
import { episodesListByAnimeId, EpisodesListByAnimeIdRow } from "@sqlc/episodes_sql";
import { EpisodeErrors } from "./episode.errors";
import { type EpisodesTreeRoot, episodeTransformList } from "./episode.model";

export async function getEpisodesTreeByAnime(
  db: Pool,
  animeId: string
): Promise<EpisodesTreeRoot> {
  let episodesList: EpisodesListByAnimeIdRow[];
  try {
    episodesList = await episodesListByAnimeId(db, { animeId });
  } catch(e) {
    throw EpisodeErrors.error("db-read").withDetails(e);
  }

  return episodeTransformList(episodesList);
}
