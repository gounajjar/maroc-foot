import type { Metadata } from "next";
import { Fragment, Suspense } from "react";
import { AdSlot } from "@/components/AdSlot";
import { ArticleCard } from "@/components/ArticleCard";
import { getDictionary, getLocale } from "@/dictionaries";
import { adEnabled } from "@/lib/ads";
import { getArticles } from "@/lib/articles";
import { commentLabel, PostCard } from "@/components/PostCard";
import { commentCountsByPost } from "@/lib/comments";
import { getPosts } from "@/lib/posts";

const AD_EVERY = 6;

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: `${dict.articles.title} · ${dict.site.name}`, description: dict.articles.intro };
}

export default async function ArticlesPage() {
  const dict = await getDictionary();
  return (
    <article className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold">{dict.articles.title}</h1>
        <p className="mt-1 opacity-70">{dict.articles.intro}</p>
      </header>
      <Suspense>
        <OwnPosts />
      </Suspense>
      <Suspense fallback={<p className="opacity-60">…</p>}>
        <ArticleGrid />
      </Suspense>
    </article>
  );
}

async function ArticleGrid() {
  const locale = await getLocale();
  const dict = await getDictionary();
  const articles = await getArticles(locale, 30);
  if (articles.length === 0) return <p className="opacity-70">{dict.articles.empty}</p>;
  const ads = adEnabled("inline");
  return (
    <section className="space-y-4 border-t border-black/10 pt-6 dark:border-white/10">
      <header>
        <h2 className="font-display text-2xl font-extrabold">{dict.articles.press}</h2>
        <p className="mt-1 text-sm opacity-70">{dict.articles.pressIntro}</p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((a, i) => (
          <Fragment key={a.url}>
            <li>
              <ArticleCard article={a} locale={locale} readLabel={dict.articles.read} externalLabel={dict.articles.external} />
            </li>
            {/* One ad after every two rows of cards (on the widest grid). */}
            {ads && i % AD_EVERY === AD_EVERY - 1 && i < articles.length - 1 && (
              <li className="col-span-full">
                <AdSlot placement="inline" />
              </li>
            )}
          </Fragment>
        ))}
      </ul>
    </section>
  );
}

// Articles written on Maroc-Foot come first, before the selection from other media.
async function OwnPosts() {
  const locale = await getLocale();
  const dict = await getDictionary();
  const [posts, counts] = await Promise.all([getPosts(locale, 12), commentCountsByPost()]);
  if (posts.length === 0) return null;
  return (
    <section className="space-y-4">
      <header>
        <h2 className="font-display text-2xl font-extrabold">{dict.articles.oursTitle}</h2>
        <p className="mt-1 text-sm opacity-70">{dict.articles.oursIntro}</p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <li key={p.id}>
            <PostCard post={p} label={dict.articles.ours} comments={commentLabel(dict.articles, counts[p.id])} />
          </li>
        ))}
      </ul>
    </section>
  );
}
