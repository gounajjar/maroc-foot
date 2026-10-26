import type { Source } from "@/lib/football/types";
import type { Locale } from "@/lib/i18n";

// Competitions shown on the site. To add one, append an entry with its data
// source (provider and that provider's id for it); set `enabled: false` to
// hide it without deleting it.
export type Competition = {
  slug: string;
  source: Source;
  country: string;
  enabled: boolean;
  names: Record<Locale, string>;
};

export const competitions: Competition[] = [
  { slug: "botola-pro", source: { provider: "apiFootball", id: "200" }, country: "MA", enabled: true, names: { fr: "Botola Pro", ar: "البطولة الاحترافية", en: "Botola Pro" } },
  { slug: "premier-league", source: { provider: "footballData", id: "PL" }, country: "GB", enabled: true, names: { fr: "Premier League", ar: "الدوري الإنجليزي الممتاز", en: "Premier League" } },
  { slug: "laliga", source: { provider: "footballData", id: "PD" }, country: "ES", enabled: true, names: { fr: "LaLiga", ar: "الدوري الإسباني", en: "LaLiga" } },
  { slug: "serie-a", source: { provider: "footballData", id: "SA" }, country: "IT", enabled: true, names: { fr: "Serie A", ar: "الدوري الإيطالي", en: "Serie A" } },
  { slug: "bundesliga", source: { provider: "footballData", id: "BL1" }, country: "DE", enabled: true, names: { fr: "Bundesliga", ar: "الدوري الألماني", en: "Bundesliga" } },
  { slug: "ligue-1", source: { provider: "footballData", id: "FL1" }, country: "FR", enabled: true, names: { fr: "Ligue 1", ar: "الدوري الفرنسي", en: "Ligue 1" } },
];

export const enabledCompetitions = () => competitions.filter((c) => c.enabled);

export const findCompetition = (slug: string) =>
  enabledCompetitions().find((c) => c.slug === slug);
