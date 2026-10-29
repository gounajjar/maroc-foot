import "server-only";
import { db } from "@/lib/articles/db";
import { hasLocale, locales } from "@/lib/i18n";
import type { Post, PostInput } from "./types";

type PostRow = {
  id: number;
  image_id: number | null;
  published: boolean;
  featured: boolean;
  feature_order: number;
  published_at: Date | null;
  updated_at: Date;
  versions: { lang: string; title: string; summary: string; body: string }[];
};

const toPost = (r: PostRow): Post => ({
  id: r.id,
  imageId: r.image_id,
  published: r.published,
  featured: r.featured,
  featureOrder: r.feature_order,
  publishedAt: r.published_at?.toISOString() ?? null,
  updatedAt: r.updated_at.toISOString(),
  versions: Object.fromEntries(
    r.versions.filter((v) => hasLocale(v.lang)).map((v) => [v.lang, { title: v.title, summary: v.summary, body: v.body }]),
  ),
});

async function selectPosts(id: number | null): Promise<Post[]> {
  const sql = await db();
  const rows = await sql<PostRow[]>`
    select p.id, p.image_id, p.published, p.featured, p.feature_order, p.published_at, p.updated_at,
      coalesce((select json_agg(json_build_object('lang', t.lang, 'title', t.title, 'summary', t.summary, 'body', t.body))
        from post_translations t where t.post_id = p.id), '[]') as versions
    from posts p
    ${id === null ? sql`` : sql`where p.id = ${id}`}
    order by coalesce(p.published_at, p.created_at) desc`;
  return rows.map(toPost);
}

// Every post, drafts included, for the admin page and the cached site reads.
export const listPosts = () => selectPosts(null);

export async function getPost(id: number): Promise<Post | null> {
  if (!Number.isSafeInteger(id)) return null;
  const [post] = await selectPosts(id);
  return post ?? null;
}

// The publication date is set the first time a post is published, and kept after.
export async function savePost(id: number | null, p: PostInput): Promise<number> {
  const sql = await db();
  return sql.begin(async (tx) => {
    let postId = id;
    if (postId === null) {
      const [row] = await tx<{ id: number }[]>`
        insert into posts (image_id, published, featured, feature_order, published_at)
        values (${p.imageId}, ${p.published}, ${p.featured}, ${p.featureOrder}, ${p.published ? new Date() : null})
        returning id`;
      postId = row.id;
    } else {
      await tx`
        update posts set image_id = ${p.imageId}, published = ${p.published}, featured = ${p.featured},
          feature_order = ${p.featureOrder},
          published_at = case when ${p.published} then coalesce(published_at, now()) else published_at end,
          updated_at = now()
        where id = ${postId}`;
    }
    for (const lang of locales) {
      const v = p.versions[lang];
      if (v) {
        await tx`
          insert into post_translations (post_id, lang, title, summary, body)
          values (${postId}, ${lang}, ${v.title}, ${v.summary}, ${v.body})
          on conflict (post_id, lang) do update set title = excluded.title, summary = excluded.summary, body = excluded.body`;
      } else {
        await tx`delete from post_translations where post_id = ${postId} and lang = ${lang}`;
      }
    }
    return postId;
  });
}

export async function setFeatured(id: number, featured: boolean) {
  const sql = await db();
  await sql`update posts set featured = ${featured}, updated_at = now() where id = ${id}`;
}

export async function deletePost(id: number) {
  const sql = await db();
  const [row] = await sql<{ image_id: number | null }[]>`delete from posts where id = ${id} returning image_id`;
  if (row?.image_id) await sql`delete from post_images where id = ${row.image_id}`;
}

export async function saveImage(mime: string, data: Buffer): Promise<number> {
  const sql = await db();
  const [row] = await sql<{ id: number }[]>`insert into post_images (mime, data) values (${mime}, ${data}) returning id`;
  return row.id;
}

export async function getImage(id: number): Promise<{ mime: string; data: Buffer } | null> {
  if (!Number.isSafeInteger(id)) return null;
  const sql = await db();
  const [row] = await sql<{ mime: string; data: Buffer }[]>`select mime, data from post_images where id = ${id}`;
  return row ?? null;
}
