import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Flag } from "@/components/Flag";
import { Tabs } from "@/components/Tabs";
import { getDictionary, getLocale, type Dictionary } from "@/dictionaries";
import { enabledCompetitions, findCompetition } from "@/lib/competitions";
import { getLastResults, getNextFixtures, getStandings, type Loaded, type Match, type Source, type StandingRow, type Team } from "@/lib/football";
import { teamName } from "@/lib/football/team-names";
import type { Locale } from "@/lib/i18n";

const MATCH_COUNT = 20;

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
    <article>
      <h1 className="font-display mb-5 flex items-center gap-3 text-3xl font-extrabold">
        <Flag country={competition.country} size={40} />
        {competition.names[locale]}
      </h1>
      <Tabs
        tabs={[
          {
            id: "standings",
            label: dict.league.standings,
            content: (
              <Suspense>
                <Standings source={source} dict={dict} locale={locale} />
              </Suspense>
            ),
          },
          {
            id: "upcoming",
            label: dict.league.upcoming,
            content: (
              <Suspense>
                <Matches load={getNextFixtures(source, MATCH_COUNT)} dict={dict} locale={locale} />
              </Suspense>
            ),
          },
          {
            id: "results",
            label: dict.league.results,
            content: (
              <Suspense>
                <Matches load={getLastResults(source, MATCH_COUNT)} dict={dict} locale={locale} />
              </Suspense>
            ),
          },
        ]}
      />
    </article>
  );
}

function Unavailable({ result, dict }: { result: Loaded<unknown>; dict: Dictionary }) {
  if (result.ok) return null;
  return <p className="opacity-70">{result.reason === "noKey" ? dict.league.noKey : dict.league.noData}</p>;
}

function Crest({ team }: { team: Team }) {
  if (!team.logo) return <span className="size-5 shrink-0" />;
  // Crests come from each provider's CDN, so they are not run through next/image.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={team.logo} alt="" width={20} height={20} loading="lazy" className="size-5 shrink-0 object-contain" />;
}

const tableClass = "w-full overflow-hidden rounded-xl bg-white text-sm shadow-sm dark:bg-white/5";

async function Standings({ source, dict, locale }: { source: Source; dict: Dictionary; locale: Locale }) {
  const result = await getStandings(source);
  if (!result.ok) return <Unavailable result={result} dict={dict} />;
  const l = dict.league;
  if (result.data.length === 0) return <p className="opacity-70">{l.noTable}</p>;
  // Some cups split the table into groups: one table per group, in order.
  const groups: { name?: string; rows: StandingRow[] }[] = [];
  for (const row of result.data) {
    if (groups.length > 0 && groups.at(-1)!.name === row.group) groups.at(-1)!.rows.push(row);
    else groups.push({ name: row.group, rows: [row] });
  }
  // Won, drawn and lost are hidden on narrow screens to leave room for names.
  const stats = [
    { label: l.played, value: (r: StandingRow) => r.played },
    { label: l.won, value: (r: StandingRow) => r.won, wide: true },
    { label: l.drawn, value: (r: StandingRow) => r.drawn, wide: true },
    { label: l.lost, value: (r: StandingRow) => r.lost, wide: true },
    { label: l.goalsFor, value: (r: StandingRow) => r.goalsFor },
    { label: l.goalsAgainst, value: (r: StandingRow) => r.goalsAgainst },
    { label: l.goalDiff, value: (r: StandingRow) => (r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff) },
  ];
  const cell = (wide?: boolean) => `px-1.5 py-2 text-center tabular-nums ${wide ? "hidden sm:table-cell" : ""}`;

  return (
    <>
      <div className="space-y-6">
        {groups.map(({ name, rows }) => (
          <section key={name ?? ""}>
            {name && (
              <h3 className="font-display mb-2 text-lg font-bold">
                {l.group} {name}
              </h3>
            )}
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead className="bg-brand-red text-xs text-white uppercase">
                  <tr>
                    <th className="w-8 py-2 ps-3 text-start">#</th>
                    <th className="px-2 py-2 text-start">{l.team}</th>
                    {stats.map((s) => (
                      <th key={s.label} className={cell(s.wide)}>
                        {s.label}
                      </th>
                    ))}
                    <th className="py-2 pe-3 ps-1.5 text-center">{l.points}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.team.id} className="border-t border-black/5 dark:border-white/10">
                      <td className="py-2 ps-3 font-semibold tabular-nums opacity-60">{row.rank}</td>
                      <td className="px-2 py-2">
                        <span className="flex items-center gap-2">
                          <Crest team={row.team} />
                          <span className="font-medium">{teamName(row.team, locale)}</span>
                        </span>
                      </td>
                      {stats.map((s) => (
                        <td key={s.label} className={cell(s.wide)}>
                          {s.value(row)}
                        </td>
                      ))}
                      <td className="py-2 pe-3 ps-1.5 text-center font-bold tabular-nums">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
      <p className="mt-2 text-xs opacity-60">{l.legend}</p>
    </>
  );
}

async function Matches({ load: pending, dict, locale }: { load: Promise<Loaded<Match[]>>; dict: Dictionary; locale: Locale }) {
  const result = await pending;
  if (!result.ok) return <Unavailable result={result} dict={dict} />;
  if (result.data.length === 0) return <p className="opacity-70">{dict.league.noMatches}</p>;

  const timeZone = "Africa/Casablanca";
  const day = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone });
  const time = new Intl.DateTimeFormat(locale, { timeStyle: "short", timeZone });
  // Matches arrive sorted, so consecutive matches on the same day share a heading.
  const days: { label: string; matches: Match[] }[] = [];
  for (const m of result.data) {
    const label = day.format(new Date(m.kickoff));
    if (days.at(-1)?.label === label) days.at(-1)!.matches.push(m);
    else days.push({ label, matches: [m] });
  }

  return (
    <table className={tableClass}>
      {days.map(({ label, matches }) => (
        <tbody key={label}>
          <tr className="bg-black/5 dark:bg-white/10">
            <th colSpan={4} className="px-3 py-1.5 text-start text-xs font-semibold uppercase opacity-70">
              {label}
            </th>
          </tr>
          {matches.map((m) => (
            <tr key={m.id} className="border-t border-black/5 dark:border-white/10">
              <td className="w-14 py-2 ps-3 text-xs tabular-nums opacity-60">{time.format(new Date(m.kickoff))}</td>
              <td className="px-2 py-2">
                <span className="flex items-center justify-end gap-2 text-end">
                  <span className="font-medium">{teamName(m.home, locale)}</span>
                  <Crest team={m.home} />
                </span>
              </td>
              <td className="w-16 py-2 text-center">
                {m.status === "scheduled" ? (
                  <span className="opacity-40">–</span>
                ) : (
                  // Two spans in a flex row, so the home score stays beside the home team in RTL.
                  <span
                    className={`inline-flex gap-1.5 rounded-md px-2 py-0.5 font-bold tabular-nums ${m.status === "live" ? "bg-brand-red text-white" : "bg-[#12100f] text-white dark:bg-white/15"}`}
                  >
                    <span>{m.homeGoals ?? 0}</span>-<span>{m.awayGoals ?? 0}</span>
                  </span>
                )}
              </td>
              <td className="py-2 pe-3 ps-2">
                <span className="flex items-center gap-2">
                  <Crest team={m.away} />
                  <span className="font-medium">{teamName(m.away, locale)}</span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      ))}
    </table>
  );
}
