import { Pool } from "pg";
import { createEpisode, CreateEpisodeArgs, CreateEpisodeRow, episodeById, EpisodeByIdRow, episodesListByAnimeId, EpisodesListByAnimeIdRow, lockAnimeEpisodes, putEpisode, PutEpisodeArgs, PutEpisodeRow } from "@sqlc/episodes_sql";
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

export async function safeCreateEpisode(
  db: Pool,
  episode: CreateEpisodeArgs
): Promise<CreateEpisodeRow> {
  const con = await db.connect();
  let createdEpisode: CreateEpisodeRow|null;

  try {
    await con.query("BEGIN;");
    await lockAnimeEpisodes(con, { animeId: episode.animeId });
    createdEpisode = await createEpisode(con, episode);
    await con.query("COMMIT;");
  } catch(e) {
    await con.query("ROLLBACK;").catch(_ => {});
    throw EpisodeErrors.error("db-create").withDetails(e);
  } finally {
    con.release();
  }

  if (!createdEpisode) throw EpisodeErrors.error("db-create");

  return createdEpisode;
}

export async function safePutEpisode(
  db: Pool,
  episode: PutEpisodeArgs 
): Promise<PutEpisodeRow> {
  const con = await db.connect();
  let updatedEpisode: PutEpisodeRow|null;

  try {
    await con.query("BEGIN;");
    await lockAnimeEpisodes(con, { animeId: episode.animeId });
    updatedEpisode = await putEpisode(con, episode);
    await con.query("COMMIT;");
  } catch(e) {
    await con.query("ROLLBACK;").catch(_ => {});
    throw EpisodeErrors.error("db-update").withDetails(e);
  } finally {
    con.release();
  }

  if (!updatedEpisode) throw EpisodeErrors.error("not-found");

  return updatedEpisode;
}
