import type { Metadata } from "next";
import { Fragment, Suspense } from "react";
import { AdSlot } from "@/components/AdSlot";
import { ArticleCard } from "@/components/ArticleCard";
import { getDictionary, getLocale } from "@/dictionaries";
import { adEnabled } from "@/lib/ads";
import { getArticles } from "@/lib/articles";

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
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((a, i) => (
        <Fragment key={a.url}>
          <li>
            <ArticleCard article={a} locale={locale} readLabel={dict.articles.read} />
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
  );
}
