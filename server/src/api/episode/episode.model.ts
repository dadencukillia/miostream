export interface EpisodesTreeRoot {
  sub: Record<string, EpisodesTreeEpisode[]>,
  dub: Record<string, EpisodesTreeEpisode[]>,
  unknown: Record<string, EpisodesTreeEpisode[]>
}

interface EpisodesTreeEpisode {
  episodeId: string|number,
  episodeName: string
}

interface EpisodeTransformListInput {
  episodeId: string;
  episodeName: string;
  localizationStudio: string;
  localizationType: string | null;
}

export const episodeTransformList = (list: EpisodeTransformListInput[]): EpisodesTreeRoot => {
  const root: EpisodesTreeRoot = { sub: {}, dub: {}, unknown: {} };

  for (const lu of list) {
    const unit: EpisodesTreeEpisode = {
      episodeId: lu.episodeId,
      episodeName: lu.episodeName
    };

    if (lu.localizationType === "sub")
      root.sub[lu.localizationStudio] = root.sub[lu.localizationStudio]?.concat([unit]) ?? [unit];
    else if (lu.localizationType === "dub")
      root.dub[lu.localizationStudio] = root.dub[lu.localizationStudio]?.concat([unit]) ?? [unit];
    else
      root.unknown[lu.localizationStudio] = root.unknown[lu.localizationStudio]?.concat([unit]) ?? [unit];
  }

  return root;
}
