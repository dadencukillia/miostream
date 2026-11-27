import { Badge } from "@ui/badge";
import { useState } from "react";

export const animeGenres = [
  "action", "adventure", "avant_garde", "award_winning", "boys_love",
  "comedy", "drama", "fantasy", "girls_love", "gourmet", "horror", "mystery",
  "romance", "sci_fi", "slice_of_life", "sports", "supernatural", "suspense",
  "ecchi", "erotica", "hentai", "adult_cast", "anthropomorphic", "cgdct", "childcare",
  "combat_sports", "crossdressing", "delinquents", "detective", "educational", "gag_humor",
  "gore", "harem", "high_stakes_game", "historical", "idols_female", "idols_male", 
  "isekai", "iyashikei", "love_polygon", "love_status_quo", "fantasy_sex_shift", 
  "mahou_shoujo", "martial_arts", "mecha", "medical", "military", "music", "mythology", 
  "organized_crime", "otaku_culture", "parody", "performing_arts", "pets", "psychological", 
  "racing", "reincarnation", "reverse_harem", "samurai", "school", "showbiz", "space", 
  "strategy_game", "super_power", "survival", "team_sports", "time_travel", "urban_fantasy",
  "vampire", "video_game", "villainess", "visual_arts", "workplace", "josei", "kids", "seinen", "shoujo", "shounen"
] as const;

const genreTranslations: Record<typeof animeGenres[number], string> = {
  action: "Бойовик",
  adventure: "Пригоди",
  avant_garde: "Авангард",
  award_winning: "Нагороджене",
  boys_love: "Boys Love",
  comedy: "Комедія",
  drama: "Драма",
  fantasy: "Фентезі",
  girls_love: "Girls Love",
  gourmet: "Ґурме",
  horror: "Жахи",
  mystery: "Детектив",
  romance: "Романтика",
  sci_fi: "Наукова фантастика",
  slice_of_life: "Повсякденність",
  sports: "Спорт",
  supernatural: "Надприродне",
  suspense: "Трилер",
  ecchi: "Етті",
  erotica: "Еротика",
  hentai: "Хентай",
  adult_cast: "Дорослі персонажі",
  anthropomorphic: "Антропоморфні",
  cgdct: "Милі дівчата роблять милі речі",
  childcare: "Догляд за дітьми",
  combat_sports: "Бойові мистецтва (спорт)",
  crossdressing: "Кросдресинг",
  delinquents: "Хулігани",
  detective: "Детектив",
  educational: "Освітній",
  gag_humor: "Ґеґ-гумор",
  gore: "Гор",
  harem: "Гарем",
  high_stakes_game: "Високі ставки",
  historical: "Історичний",
  idols_female: "Жіночі ідоли",
  idols_male: "Чоловічі ідоли",
  isekai: "Ісекай",
  iyashikei: "Іяшікей (цілюще)",
  love_polygon: "Любовний трикутник",
  love_status_quo: "Незмінний статус кохання",
  fantasy_sex_shift: "Зміна статі",
  mahou_shoujo: "Махо-сьоджьо",
  martial_arts: "Бойові мистецтва",
  mecha: "Меха",
  medical: "Медицина",
  military: "Військове",
  music: "Музика",
  mythology: "Міфологія",
  organized_crime: "Організована злочинність",
  otaku_culture: "Культура отаку",
  parody: "Пародія",
  performing_arts: "Виконавське мистецтво",
  pets: "Тварини-улюбленці",
  psychological: "Психологічне",
  racing: "Перегони",
  reincarnation: "Реінкарнація",
  reverse_harem: "Зворотний гарем",
  samurai: "Самураї",
  school: "Школа",
  showbiz: "Шоу-бізнес",
  space: "Космос",
  strategy_game: "Стратегічні ігри",
  super_power: "Суперсили",
  survival: "Виживання",
  team_sports: "Командний спорт",
  time_travel: "Подорожі в часі",
  urban_fantasy: "Міське фентезі",
  vampire: "Вампіри",
  video_game: "Відеоігри",
  villainess: "Лиходійка",
  visual_arts: "Візуальне мистецтво",
  workplace: "Робоче місце",
  josei: "Джосей",
  kids: "Дитяче",
  seinen: "Сейнен",
  shoujo: "Сьоджьо",
  shounen: "Сьонен"
};

export default function GenreBadgesLine({ genres, limit }: {
  genres: (typeof animeGenres[number])[],
  limit?: number
}) {
  const displayCount = limit && limit > 0 ? Math.min(limit, genres.length) : genres.length;
  const limitShifted = genres.length - displayCount;

  const [ displayingCount, setDisplayingCount ] = useState(displayCount);

  const unfoldBadges = () => {
    setDisplayingCount(genres.length);
  };

  return (<>
    { genres.slice(0, displayingCount).map(genreSlug => (
      <Badge key={ genreSlug } variant="secondary">{ genreTranslations[genreSlug] }</Badge>
    )) }
    { displayingCount === genres.length ? (<></>) : (
      <Badge
        className="cursor-pointer"
        variant="outline"
        onClick={ unfoldBadges }
      >+{ limitShifted }</Badge>
    ) }
  </>);
}
