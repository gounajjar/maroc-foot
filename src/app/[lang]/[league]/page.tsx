import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getDictionary, getLocale, type Dictionary } from "@/dictionaries";
import { enabledCompetitions, findCompetition } from "@/lib/competitions";
import { getLastResults, getNextFixtures, getStandings, type Loaded, type Match, type Source } from "@/lib/football";
import type { Locale } from "@/lib/i18n";

export async function generateStaticParams() {
  return enabledCompetitions().map((c) => ({ league: c.slug }));
}

export default async function LeaguePage({ params }: PageProps<"/[lang]/[league]">) {
  const { league } = await params;
  const competition = findCompetition(league);
  if (!competition) notFound();
  const locale = await getLocale();
  const dict = await getDictionary();
  const { source } = competition;

  return (
    <article className="space-y-8">
      <h1 className="text-2xl font-semibold">{competition.names[locale]}</h1>
      <Suspense>
        <Standings source={source} dict={dict} />
      </Suspense>
      <div className="grid gap-8 md:grid-cols-2">
        <Suspense>
          <Matches title={dict.league.fixtures} load={getNextFixtures(source)} dict={dict} locale={locale} />
        </Suspense>
        <Suspense>
          <Matches title={dict.league.results} load={getLastResults(source)} dict={dict} locale={locale} />
        </Suspense>
      </div>
    </article>
  );
}

function Unavailable({ result, dict }: { result: Loaded<unknown>; dict: Dictionary }) {
  if (result.ok) return null;
  return <p className="opacity-70">{result.reason === "noKey" ? dict.league.noKey : dict.league.noData}</p>;
}

async function Standings({ source, dict }: { source: Source; dict: Dictionary }) {
  const result = await getStandings(source);
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">{dict.league.standings}</h2>
      {!result.ok ? (
        <Unavailable result={result} dict={dict} />
      ) : (
        <table className="w-full text-sm">
          <thead className="opacity-70">
            <tr>
              <th className="w-8 py-1 text-start">#</th>
              <th className="py-1 text-start">{dict.league.team}</th>
              <th className="py-1 text-end">{dict.league.played}</th>
              <th className="py-1 text-end">{dict.league.goalDiff}</th>
              <th className="py-1 text-end">{dict.league.points}</th>
            </tr>
          </thead>
          <tbody>
            {result.data.map((row) => (
              <tr key={row.team.id} className="border-t border-black/10 dark:border-white/10">
                <td className="py-1">{row.rank}</td>
                <td className="py-1">{row.team.name}</td>
                <td className="py-1 text-end">{row.played}</td>
                <td className="py-1 text-end">{row.goalDiff}</td>
                <td className="py-1 text-end font-semibold">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

async function Matches({
  title,
  load: pending,
  dict,
  locale,
}: {
  title: string;
  load: Promise<Loaded<Match[]>>;
  dict: Dictionary;
  locale: Locale;
}) {
  const result = await pending;
  const time = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Casablanca" });
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">{title}</h2>
      {!result.ok ? (
        <Unavailable result={result} dict={dict} />
      ) : (
        <ul className="space-y-2 text-sm">
          {result.data.map((m) => (
            <li key={m.id} className="rounded-md border border-black/10 p-2 dark:border-white/10">
              <div className="opacity-60">{time.format(new Date(m.kickoff))}</div>
              <div className="flex justify-between gap-2">
                <span>{m.home.name}</span>
                <span className="font-semibold">
                  {m.status === "scheduled" ? "–" : `${m.homeGoals ?? 0} - ${m.awayGoals ?? 0}`}
                </span>
                <span>{m.away.name}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
