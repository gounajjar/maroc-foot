import { ArticleImage } from "./ArticleImage";
import type { Article } from "@/lib/articles";
import type { Locale } from "@/lib/i18n";

// Card for an external article: picture, title, teaser and a link to the
// source site. The article itself is read on the source site.
export function ArticleCard({ article, locale, readLabel, externalLabel }: { article: Article; locale: Locale; readLabel: string; externalLabel: string }) {
  const date = article.publishedAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "Africa/Casablanca" }).format(new Date(article.publishedAt))
    : null;

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-white/5 dark:ring-white/10"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-[#12100f]">
        <ArticleImage src={article.image} source={article.source} />
        <span className="absolute end-2 top-2 rounded-full bg-[#12100f]/80 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur">
          {externalLabel} <span aria-hidden="true" className="inline-block rtl:-scale-x-100">↗</span>
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p dir="auto" className="text-xs font-semibold tracking-wide text-brand-red uppercase">
          {article.source}
          {date && <span className="font-normal text-current opacity-60"> · <bdi>{date}</bdi></span>}
        </p>
        <h3 dir="auto" className="font-display text-xl leading-snug font-extrabold">{article.title}</h3>
        {article.description && <p dir="auto" className="line-clamp-3 text-sm opacity-75">{article.description}</p>}
        <span className="mt-auto pt-2 text-sm font-semibold text-brand-green dark:text-[#9fe3b9]">
          {readLabel.replace("{source}", article.source)} <span aria-hidden="true" className="inline-block rtl:-scale-x-100">↗</span>
        </span>
      </div>
    </a>
  );
}
