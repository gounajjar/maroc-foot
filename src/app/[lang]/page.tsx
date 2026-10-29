import { Suspense } from "react";
import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { ArticleCard } from "@/components/ArticleCard";
import { getDictionary, getLocale } from "@/dictionaries";
import { enabledCompetitions, type Competition } from "@/lib/competitions";
import { Flag } from "@/components/Flag";
import { TodayMatches } from "@/components/TodayMatches";
import type { Locale } from "@/lib/i18n";
import { getArticles } from "@/lib/articles";

// Card colour per country, taken from each flag.
const cardColors: Record<string, string> = {
  MA: "#c1272d",
  GB: "#1d2a5b",
  ES: "#aa151b",
  IT: "#00703a",
  DE: "#1c1c1c",
  FR: "#0055a4",
  EU: "#003399",
  AF: "#006233",
};

const STAR = "50,19 68.2,75.1 20.5,40.4 79.5,40.4 31.8,75.1";

export default async function Home() {
  const locale = await getLocale();
  const dict = await getDictionary();
  const [featured, ...others] = enabledCompetitions().filter((c) => c.type === "league");
  const cups = enabledCompetitions().filter((c) => c.type === "cup");
  const country = (c: Competition) => dict.home.countries[c.country as keyof typeof dict.home.countries];

  return (
    <div className="flex flex-col gap-10">
      <Suspense>
        <TodayMatches locale={locale} labels={dict.today} />
      </Suspense>

      <section>
        <h2 className="font-display mb-4 text-2xl font-extrabold">{dict.home.competitions}</h2>
        {featured && (
          <Link
            href={`/${locale}/${featured.slug}`}
            style={{ backgroundColor: cardColors[featured.country] }}
            className="group relative mb-4 flex items-center gap-5 overflow-hidden rounded-2xl p-6 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <Flag country={featured.country} size={72} />
            <span className="flex flex-col">
              <span className="font-display text-3xl font-extrabold">{featured.names[locale]}</span>
              <span className="text-white/80">
                {country(featured)} · {dict.home.standings}
              </span>
            </span>
            <svg viewBox="0 0 100 100" aria-hidden="true" className="absolute -end-6 -bottom-10 w-44 text-white/15 transition group-hover:rotate-12">
              <polygon points={STAR} fill="none" stroke="currentColor" strokeWidth="7" />
            </svg>
          </Link>
        )}
        <CompetitionCards competitions={others} locale={locale} country={country} />
      </section>

      {cups.length > 0 && (
        <section>
          <h2 className="font-display mb-4 text-2xl font-extrabold">{dict.home.cups}</h2>
          <CompetitionCards competitions={cups} locale={locale} country={country} />
        </section>
      )}

      <AdSlot placement="inline" />

      <Suspense>
        <LatestArticles />
      </Suspense>
    </div>
  );
}

function CompetitionCards({
  competitions,
  locale,
  country,
}: {
  competitions: Competition[];
  locale: Locale;
  country: (c: Competition) => string;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {competitions.map((c) => (
        <li key={c.slug} className="last:odd:col-span-2 sm:last:odd:col-span-1">
          <Link
            href={`/${locale}/${c.slug}`}
            style={{ backgroundColor: cardColors[c.country] }}
            className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-xl p-4 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <Flag country={c.country} size={44} />
            <span className="flex flex-col">
              <span className="font-display text-xl leading-tight font-extrabold">{c.names[locale]}</span>
              <span className="text-sm text-white/75">{country(c)}</span>
            </span>
            <svg viewBox="0 0 100 100" aria-hidden="true" className="absolute -end-5 -top-5 w-24 text-white/10 transition group-hover:rotate-45">
              <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="6" />
              <polygon points="50,33 66.2,44.7 60,63.8 40,63.8 33.8,44.7" fill="currentColor" />
            </svg>
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function LatestArticles() {
  const locale = await getLocale();
  const dict = await getDictionary();
  const articles = await getArticles(locale, 3);
  if (articles.length === 0) return null;
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl font-extrabold">{dict.articles.latest}</h2>
        <Link href={`/${locale}/articles`} className="text-sm font-semibold text-brand-red hover:underline">
          {dict.articles.seeAll} <span aria-hidden="true" className="inline-block rtl:-scale-x-100">→</span>
        </Link>
      </div>
      <ul className="grid gap-4 sm:grid-cols-3">
        {articles.map((a) => (
          <li key={a.url}>
            <ArticleCard article={a} locale={locale} readLabel={dict.articles.read} />
          </li>
        ))}
      </ul>
    </section>
  );
}
