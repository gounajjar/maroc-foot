import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { hasDatabase } from "@/lib/articles/db";
import type { Locale } from "@/lib/i18n";
import { getPost, listPosts } from "./db";
import { localize, type LocalizedPost, type Post } from "./types";

export * from "./types";

export const POSTS_TAG = "posts";

// Published posts, newest first. Cached like the external articles and
// refreshed right away when a post is saved in the admin page.
async function publishedPosts(): Promise<Post[]> {
  "use cache";
  cacheTag(POSTS_TAG);
  cacheLife("hours");
  if (!hasDatabase()) return [];
  try {
    return (await listPosts()).filter((p) => p.published);
  } catch (err) {
    console.error(err);
    return [];
  }
}

const inLanguage = (posts: Post[], locale: Locale) =>
  posts.map((p) => localize(p, locale)).filter((p): p is LocalizedPost => p !== null);

export async function getPosts(locale: Locale, count = 30): Promise<LocalizedPost[]> {
  return inLanguage(await publishedPosts(), locale).slice(0, count);
}

// Position 0 means "no position": after the numbered ones, newest first.
const position = (p: Post) => p.featureOrder || Number.MAX_SAFE_INTEGER;

// Posts the owner put "à la une", in the order chosen in the admin page.
export async function getFeaturedPosts(locale: Locale, count = 4): Promise<LocalizedPost[]> {
  const featured = (await publishedPosts())
    .filter((p) => p.featured)
    .sort((a, b) => position(a) - position(b) || (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  return inLanguage(featured, locale).slice(0, count);
}

export async function getPublishedPost(id: number, locale: Locale): Promise<LocalizedPost | null> {
  "use cache";
  cacheTag(POSTS_TAG);
  cacheLife("hours");
  if (!hasDatabase()) return null;
  const post = await getPost(id);
  return post?.published ? localize(post, locale) : null;
}
