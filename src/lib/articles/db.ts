import "server-only";
import postgres from "postgres";
import { hasLocale, type Locale } from "@/lib/i18n";
import type { Article, Feed, ManualArticle } from "./types";

// Feeds used while no database is configured, and copied into the database
// the first time it is used. They can then be changed from the admin page.
export const defaultFeeds: Omit<Feed, "id">[] = [
  { url: "https://fr.hespress.com/sport/feed", name: "Hespress FR", lang: "fr" },
  { url: "https://dwh.lequipe.fr/api/edito/rss?path=/Football/", name: "L'Équipe", lang: "fr" },
  { url: "https://www.hespress.com/sport/feed", name: "هسبريس", lang: "ar" },
  { url: "https://feeds.bbci.co.uk/sport/football/rss.xml", name: "BBC Sport", lang: "en" },
];

// The Neon integration on Vercel was connected with the prefix "MF", which
// names the variable MF_DATABASE_URL; plain DATABASE_URL works too (local dev).
const databaseUrl = () => (process.env.DATABASE_URL || process.env.MF_DATABASE_URL)?.trim() ?? "";
export const hasDatabase = () => databaseUrl().length > 0;

let client: postgres.Sql | undefined;
let ready: Promise<void> | undefined;

// prepare: false keeps queries compatible with pooled (pgbouncer) connections
// such as Neon's.
async function db() {
  if (!client) {
    client = postgres(databaseUrl(), { prepare: false, max: 3, idle_timeout: 20 });
  }
  ready ??= migrate(client).catch((err) => {
    ready = undefined;
    throw err;
  });
  await ready;
  return client;
}

async function migrate(sql: postgres.Sql) {
  await sql`
    create table if not exists article_feeds (
      id serial primary key,
      url text not null unique,
      name text not null,
      lang text not null,
      created_at timestamptz not null default now()
    )`;
  await sql`
    create table if not exists articles (
      id serial primary key,
      url text not null unique,
      title text not null,
      description text not null default '',
      image text,
      source text not null,
      published_at timestamptz,
      lang text not null,
      created_at timestamptz not null default now()
    )`;
  // Seed the default feeds once, on an empty database.
  const [{ count }] = await sql<{ count: number }[]>`select count(*)::int as count from article_feeds`;
  if (count === 0) {
    for (const f of defaultFeeds) {
      await sql`insert into article_feeds (url, name, lang) values (${f.url}, ${f.name}, ${f.lang}) on conflict do nothing`;
    }
  }
}

const toLocale = (value: string): Locale => (hasLocale(value) ? value : "fr");

export async function listFeeds(): Promise<Feed[]> {
  const sql = await db();
  const rows = await sql<{ id: number; url: string; name: string; lang: string }[]>`
    select id, url, name, lang from article_feeds order by lang, name`;
  return rows.map((r) => ({ ...r, lang: toLocale(r.lang) }));
}

export async function addFeed(feed: Omit<Feed, "id">) {
  const sql = await db();
  await sql`
    insert into article_feeds (url, name, lang) values (${feed.url}, ${feed.name}, ${feed.lang})
    on conflict (url) do update set name = excluded.name, lang = excluded.lang`;
}

export async function deleteFeed(id: number) {
  const sql = await db();
  await sql`delete from article_feeds where id = ${id}`;
}

type ArticleRow = {
  id: number;
  url: string;
  title: string;
  description: string;
  image: string | null;
  source: string;
  published_at: Date | null;
  lang: string;
};

export async function listManualArticles(limit = 100): Promise<ManualArticle[]> {
  const sql = await db();
  const rows = await sql<ArticleRow[]>`
    select id, url, title, description, image, source, published_at, lang from articles
    order by coalesce(published_at, created_at) desc limit ${limit}`;
  return rows.map((r) => ({
    id: r.id,
    url: r.url,
    title: r.title,
    description: r.description,
    image: r.image,
    source: r.source,
    publishedAt: r.published_at?.toISOString() ?? null,
    lang: toLocale(r.lang),
  }));
}

export async function addManualArticle(a: Article) {
  const sql = await db();
  await sql`
    insert into articles (url, title, description, image, source, published_at, lang)
    values (${a.url}, ${a.title}, ${a.description}, ${a.image}, ${a.source}, ${a.publishedAt ?? new Date().toISOString()}, ${a.lang})
    on conflict (url) do update set title = excluded.title, description = excluded.description,
      image = excluded.image, source = excluded.source, lang = excluded.lang`;
}

export async function deleteManualArticle(id: number) {
  const sql = await db();
  await sql`delete from articles where id = ${id}`;
}
