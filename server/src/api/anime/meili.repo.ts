import { envIndexGenerator, HybridIndex } from "@utils/meilisearch";

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
