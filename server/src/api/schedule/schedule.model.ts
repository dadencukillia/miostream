import { toAnimeModel } from "@/api/anime/anime.model";
import type { GetUpcomingEpisodesByDateRow } from "@sqlc/schedule_sql";
import type * as dto from "./schedule.dto";

export const toUpcomingEpisodeItem = (
    row: GetUpcomingEpisodesByDateRow
): dto.UpcomingEpisodeItemType => ({
    upcomingEpisodeId: row.upcomingEpisodeId,
    episodeName: row.episodeName,
    episodeDate: row.episodeDate,
    anime: toAnimeModel({
        animeId: row.animeId,
        slug: row.slug,
        titleUa: row.titleUa,
        titleEn: row.titleEn,
        titleOriginal: row.titleOriginal,
        coverId: row.coverId,
        productionStudio: row.productionStudio,
        malId: row.malId,
        anilistId: row.anilistId,
        hikkaId: row.hikkaId,
        imdbId: row.imdbId,
        yearReleased: row.yearReleased,
        avgEpisodeDuration: row.avgEpisodeDuration,
        episodesCount: row.episodesCount,
        ageRestriction: row.ageRestriction,
        animeStatus: row.animeStatus,
        animeFormat: row.animeFormat,
        genres: row.genres,
    }),
});
