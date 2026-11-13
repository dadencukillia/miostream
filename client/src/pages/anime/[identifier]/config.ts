import ComputerVideoIcon from "~icons/hugeicons/computer-video";
import BeachIcon from "~icons/hugeicons/beach-02";
import FilmRollIcon from "~icons/hugeicons/film-roll-02";
import MusicIcon from "~icons/hugeicons/music-3";
import FileUnknownIcon from "~icons/hugeicons/file-unknown";

// Age restriction

interface AgeRestrictionConfig {
  label: string,
  color: string,
  summary: string,
};

export const ageRestriction: Record<string, AgeRestrictionConfig> = {
  g: {
    label: "G",
    color: "#15803d",
    summary: "Для всіх вікових категорій"
  },
  pg: {
    label: "PG",
    color: "#1d4ed8",
    summary: "Рекомендується присутність батьків"
  },
  pg13: {
    label: "PG-13",
    color: "#b45309",
    summary: "Особлива увага батьків"
  },
  r: {
    label: "R",
    color: "#c2410c",
    summary: "Особам до 17 років перегляд дозволено лише в супроводі батьків або дорослого опікуна"
  },
  nc17: {
    label: "NC-17",
    color: "#b91c1c",
    summary: "Тільки для дорослих"
  }
};

// Status

interface AnimeStatusConfig {
  label: string,
  color: string
};

export const animeStatus: Record<string, AnimeStatusConfig> = {
  upcoming: {
    label: "Анонсовано",
    color: "#1d4ed8",
  },
  ongoing: {
    label: "Онґоїнґ",
    color: "#15803d",
  },
  cancelled: {
    label: "Скасовано",
    color: "#b91c1c",
  },
  finished: {
    label: "Завершено",
    color: "#475530",
  },
};

// Genres

export const genresMap: Record<string, string> = {
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

// Formats

interface AnimeFormatConfig {
  label: string,
  icon: (_props: Record<string, any>) => any
};

export const animeFormats: Record<string, AnimeFormatConfig> = {
  "tv": {
    label: "TV серіал",
    icon: ComputerVideoIcon
  },
	"ova": {
    label: "OVA серії",
    icon: BeachIcon
  },
	"ona": {
    label: "OVA серії",
    icon: BeachIcon
  },
	"movie": {
    label: "Фільм",
    icon: FilmRollIcon
  },
	"special": {
    label: "Спец серії",
    icon: BeachIcon
  },
	"music": {
    label: "Пісня",
    icon: MusicIcon
  },
	"other": {
    label: "Інше",
    icon: FileUnknownIcon
  },
};
