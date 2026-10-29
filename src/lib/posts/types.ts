import type { Locale } from "@/lib/i18n";

export type PostText = { title: string; summary: string; body: string };

// An article written on the site itself, from the admin page, in one to
// three languages. A language without a version does not show the post.
export type Post = {
  id: number;
  imageId: number | null;
  published: boolean;
  featured: boolean;
  featureOrder: number;
  publishedAt: string | null;
  updatedAt: string;
  versions: Partial<Record<Locale, PostText>>;
};

export type PostInput = Omit<Post, "id" | "publishedAt" | "updatedAt">;

// A post as shown on a page of one language.
export type LocalizedPost = PostText & { id: number; lang: Locale; imageId: number | null; publishedAt: string | null };

export function localize(post: Post, lang: Locale): LocalizedPost | null {
  const text = post.versions[lang];
  return text ? { ...text, id: post.id, lang, imageId: post.imageId, publishedAt: post.publishedAt } : null;
}

// Address of a post: its number, then its title for readable links.
// Only the number is used to find it, so editing the title keeps old links working.
export function postPath(post: { id: number; title: string; lang: Locale }) {
  const words = post.title
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
  return `/${post.lang}/articles/${post.id}${words ? `-${words}` : ""}`;
}

export const imagePath = (id: number) => `/api/media/${id}`;
