import * as config from "@config";
import { addHTTPOutbox } from "@sqlc/http_outbox_sql";
import { envIndexGenerator, HybridIndex } from "@utils/meilisearch";
import { Client } from "pg";

interface AnimeIndexEntry {
  animeId: string,
  titleUa: string,
  titleEn: string,
  titleOriginal: string,
  available: boolean
}

let animeIndexLazy: Promise<HybridIndex<AnimeIndexEntry>>|null = null;

export const meiliAnimeIndex = async () => {
  if (!animeIndexLazy) animeIndexLazy = envIndexGenerator<AnimeIndexEntry>("animes", "animeId").then(async ig => {
    ig.setLocales(["eng", "ukr", "jpn"]);
    await ig.updateSettings({
      searchableAttributes: ["titleUa", "titleEn", "titleOriginal"],
      filterableAttributes: ["available"]
    });
    return ig;
  });
  return animeIndexLazy;
}

export async function animeSearchQuery(query: string): Promise<string[]> {
  const index = await meiliAnimeIndex();
  const results = await index.hybridSearch(query, "available = true");
  return results.hits.map(e => e.animeId);
}

export const addOutboxMeilisearchPutTask = async <T extends AnimeIndexEntry>(con: Client, data: T) => {
  await addHTTPOutbox(con, {
    url: `http://${config.MEILI_HOST}/indexes/animes/documents`,
    method: "PUT",
    contentType: "application/json",
    body: Buffer.from(JSON.stringify({
      animeId: data.animeId,
      titleUa: data.titleUa,
      titleEn: data.titleEn,
      titleOriginal: data.titleOriginal,
      available: data.available
    })),
    outboxGroup: `anime:${data.animeId}`
  });
};

export const addOutboxMeilisearchDeleteTask = async (con: Client, animeId: string) => {
  await addHTTPOutbox(con, {
    url: `http://${config.MEILI_HOST}/indexes/animes/documents/${animeId}`,
    method: "DELETE",
    body: null,
    contentType: null,
    outboxGroup: `anime:${animeId}`
  });
}
