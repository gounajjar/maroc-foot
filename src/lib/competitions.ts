import type { Locale } from "@/lib/i18n";

// Competitions shown on the site. To add one, append an entry with its
// API-Football league id; set `enabled: false` to hide it without deleting it.
export type Competition = {
  slug: string;
  apiFootballId: number;
  country: string;
  enabled: boolean;
  names: Record<Locale, string>;
};

export const competitions: Competition[] = [
  { slug: "botola-pro", apiFootballId: 200, country: "MA", enabled: true, names: { fr: "Botola Pro", ar: "البطولة الاحترافية", en: "Botola Pro" } },
  { slug: "premier-league", apiFootballId: 39, country: "GB", enabled: true, names: { fr: "Premier League", ar: "الدوري الإنجليزي الممتاز", en: "Premier League" } },
  { slug: "laliga", apiFootballId: 140, country: "ES", enabled: true, names: { fr: "LaLiga", ar: "الدوري الإسباني", en: "LaLiga" } },
  { slug: "serie-a", apiFootballId: 135, country: "IT", enabled: true, names: { fr: "Serie A", ar: "الدوري الإيطالي", en: "Serie A" } },
  { slug: "bundesliga", apiFootballId: 78, country: "DE", enabled: true, names: { fr: "Bundesliga", ar: "الدوري الألماني", en: "Bundesliga" } },
  { slug: "ligue-1", apiFootballId: 61, country: "FR", enabled: true, names: { fr: "Ligue 1", ar: "الدوري الفرنسي", en: "Ligue 1" } },
];

export const enabledCompetitions = () => competitions.filter((c) => c.enabled);

export const findCompetition = (slug: string) =>
  enabledCompetitions().find((c) => c.slug === slug);
