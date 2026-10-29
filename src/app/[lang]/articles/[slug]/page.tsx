import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdSlot } from "@/components/AdSlot";
import { getDictionary, getLocale } from "@/dictionaries";
import { getPublishedPost, imagePath, postPath } from "@/lib/posts";
import { PostBody } from "@/lib/posts/format";
import { Comments } from "./comments";

// Address: /fr/articles/12-titre-de-l-article. Only the number counts.
const idOf = (slug: string) => Number(decodeURIComponent(slug).match(/^\d+/)?.[0]);

export async function generateMetadata({ params }: PageProps<"/[lang]/articles/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const dict = await getDictionary();
  const post = await getPublishedPost(idOf(slug), await getLocale());
  if (!post) return { title: dict.site.name };
  return {
    title: `${post.title} · ${dict.site.name}`,
    description: post.summary || undefined,
    openGraph: { title: post.title, description: post.summary || undefined, images: post.imageId ? [imagePath(post.imageId)] : undefined, type: "article" },
  };
}

export default function PostPage(props: PageProps<"/[lang]/articles/[slug]">) {
  return (
    <Suspense fallback={<p className="opacity-60">…</p>}>
      <Post {...props} />
    </Suspense>
  );
}

async function Post({ params }: PageProps<"/[lang]/articles/[slug]">) {
  const { slug } = await params;
  const locale = await getLocale();
  const dict = await getDictionary();
  const post = await getPublishedPost(idOf(slug), locale);
  if (!post) notFound();
  const date = post.publishedAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "Africa/Casablanca" }).format(new Date(post.publishedAt))
    : null;

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Link href={`/${locale}/articles`} className="text-sm font-semibold text-brand-red hover:underline">
        <span aria-hidden="true" className="inline-block rtl:-scale-x-100">←</span> {dict.articles.title}
      </Link>
      <header className="space-y-3">
        <p className="text-xs font-semibold tracking-wide text-brand-red uppercase">
          {dict.articles.ours}
          {date && <span className="font-normal text-current opacity-60"> · <bdi>{date}</bdi></span>}
        </p>
        <h1 className="font-display text-4xl leading-tight font-extrabold text-balance">{post.title}</h1>
        {post.summary && <p className="text-xl opacity-80">{post.summary}</p>}
      </header>
      {post.imageId && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imagePath(post.imageId)} alt="" className="max-h-[520px] w-full rounded-2xl object-cover" />
      )}
      <PostBody text={post.body} />
      <AdSlot placement="inline" />
      <Suspense>
        <Comments postId={post.id} path={postPath(post)} locale={locale} dict={dict} />
      </Suspense>
    </article>
  );
}
