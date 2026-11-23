import { envIndexGenerator, HybridIndex } from "@utils/meilisearch";

interface AnimeIndexEntry {
  animeId: string,
  titleUa: string,
  titleEn: string,
  titleOriginal: string
}

let animeIndexLazy: Promise<HybridIndex<AnimeIndexEntry>>|null = null;

export const meiliAnimeIndex = async () => {
  if (!animeIndexLazy) animeIndexLazy = envIndexGenerator("animes", "animeId").then(ig => {
    ig.setLocales(["eng", "ukr", "jpn"]);
    return ig;
  });
  return animeIndexLazy;
}
