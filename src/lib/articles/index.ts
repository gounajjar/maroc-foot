import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Locale } from "@/lib/i18n";
import { defaultFeeds, hasDatabase, listFeeds, listManualArticles } from "./db";
import { fetchFeed } from "./rss";
import type { Article, Feed } from "./types";

export * from "./types";

export const ARTICLES_TAG = "articles";

async function loadFeeds(): Promise<Feed[]> {
  if (!hasDatabase()) return defaultFeeds.map((f, i) => ({ ...f, id: -1 - i }));
  return listFeeds();
}

const sortKey = (a: Article) => a.publishedAt ?? "";

// All articles, newest first, shared by every page
// and refreshed every few minutes, or right away after an admin change.
async function allArticles(): Promise<Article[]> {
  "use cache";
  cacheTag(ARTICLES_TAG);
  cacheLife("minutes");

  const [manual, feeds] = await Promise.all([
    hasDatabase() ? listManualArticles().catch((err) => (console.error(err), [])) : [],
    loadFeeds().catch((err) => (console.error(err), [] as Feed[])),
  ]);
  const fromFeeds = await Promise.all(
    feeds.map((feed) => fetchFeed(feed).catch((err) => (console.error(`RSS ${feed.url}`, err), [] as Article[]))),
  );

  const seen = new Set<string>();
  const unique = [...manual, ...fromFeeds.flat()].filter((a) => !seen.has(a.url) && seen.add(a.url));
  return unique.sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
}

// Articles in the page language; falls back to every language when none match.
export async function getArticles(locale: Locale, count = 30): Promise<Article[]> {
  const all = await allArticles();
  const inLocale = all.filter((a) => a.lang === locale);
  return (inLocale.length ? inLocale : all).slice(0, count);
}
