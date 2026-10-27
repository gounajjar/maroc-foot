import type { Source } from "@/lib/football/types";
import type { Locale } from "@/lib/i18n";

// Competitions shown on the site. To add one, append an entry with its data
// source (provider and that provider's id for it); set `enabled: false` to
// hide it without deleting it. Cups use a region code ("EU", "AF") as country.
export type Competition = {
  slug: string;
  type: "league" | "cup";
  source: Source;
  country: string;
  enabled: boolean;
  names: Record<Locale, string>;
};

export const competitions: Competition[] = [
  { slug: "botola-pro", type: "league", source: { provider: "liveScore", id: "38" }, country: "MA", enabled: true, names: { fr: "Botola Pro", ar: "البطولة الاحترافية", en: "Botola Pro" } },
  { slug: "premier-league", type: "league", source: { provider: "footballData", id: "PL" }, country: "GB", enabled: true, names: { fr: "Premier League", ar: "الدوري الإنجليزي الممتاز", en: "Premier League" } },
  { slug: "laliga", type: "league", source: { provider: "footballData", id: "PD" }, country: "ES", enabled: true, names: { fr: "LaLiga", ar: "الدوري الإسباني", en: "LaLiga" } },
  { slug: "serie-a", type: "league", source: { provider: "footballData", id: "SA" }, country: "IT", enabled: true, names: { fr: "Serie A", ar: "الدوري الإيطالي", en: "Serie A" } },
  { slug: "bundesliga", type: "league", source: { provider: "footballData", id: "BL1" }, country: "DE", enabled: true, names: { fr: "Bundesliga", ar: "الدوري الألماني", en: "Bundesliga" } },
  { slug: "ligue-1", type: "league", source: { provider: "footballData", id: "FL1" }, country: "FR", enabled: true, names: { fr: "Ligue 1", ar: "الدوري الفرنسي", en: "Ligue 1" } },
  // The Champions League comes from football-data.org (free tier): Live-score's
  // table for it misses a third of the teams.
  { slug: "champions-league", type: "cup", source: { provider: "footballData", id: "CL" }, country: "EU", enabled: true, names: { fr: "Ligue des champions", ar: "دوري أبطال أوروبا", en: "Champions League" } },
  { slug: "europa-league", type: "cup", source: { provider: "liveScore", id: "245" }, country: "EU", enabled: true, names: { fr: "Ligue Europa", ar: "الدوري الأوروبي", en: "Europa League" } },
  { slug: "conference-league", type: "cup", source: { provider: "liveScore", id: "446" }, country: "EU", enabled: true, names: { fr: "Ligue Conférence", ar: "دوري المؤتمر الأوروبي", en: "Conference League" } },
  { slug: "caf-champions-league", type: "cup", source: { provider: "liveScore", id: "223" }, country: "AF", enabled: true, names: { fr: "Ligue des champions CAF", ar: "دوري أبطال أفريقيا", en: "CAF Champions League" } },
  { slug: "caf-confederation-cup", type: "cup", source: { provider: "liveScore", id: "224" }, country: "AF", enabled: true, names: { fr: "Coupe de la CAF", ar: "كأس الكونفدرالية الأفريقية", en: "CAF Confederation Cup" } },
];

export const enabledCompetitions = () => competitions.filter((c) => c.enabled);

export const findCompetition = (slug: string) =>
  enabledCompetitions().find((c) => c.slug === slug);
