import { Pool } from "pg";
import { episodeById, EpisodeByIdRow, episodesListByAnimeId, EpisodesListByAnimeIdRow } from "@sqlc/episodes_sql";
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

export async function getEpisodeById(
  db: Pool,
  animeId: string,
  episodeId: string
): Promise<EpisodeByIdRow> {
  let episode: EpisodeByIdRow | null;
  try {
    episode = await episodeById(db, { animeId, episodeId });
  } catch(e) {
    throw EpisodeErrors.error("db-read").withDetails(e);
  }

  if (!episode) {
    throw EpisodeErrors.error("not-found");
  }

  return episode;
}
