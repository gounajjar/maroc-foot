import { cacheLife } from "next/cache";
import Link from "next/link";
import { Crest } from "@/components/Crest";
import { Flag } from "@/components/Flag";
import type { Dictionary } from "@/dictionaries";
import { enabledCompetitions } from "@/lib/competitions";
import { getMatchesOfDay, type Match } from "@/lib/football";
import { teamName } from "@/lib/football/team-names";
import type { Locale } from "@/lib/i18n";

const timeZone = "Africa/Casablanca";

// Today's matches across every competition on the site, grouped by
// competition. Cached for a minute, so live scores follow without each
// visit calling the data providers.
export async function TodayMatches({ locale, labels }: { locale: Locale; labels: Dictionary["today"] }) {
  "use cache";
  cacheLife("minutes");
  const now = new Date();
  const day = new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
  const loaded = await Promise.all(
    enabledCompetitions().map(async (competition) => ({ competition, result: await getMatchesOfDay(competition.source, day, timeZone) })),
  );
  const groups = loaded.flatMap(({ competition, result }) => (result.ok && result.data.length > 0 ? [{ competition, matches: result.data }] : []));
  const liveCount = groups.reduce((n, g) => n + g.matches.filter((m) => m.status === "live").length, 0);
  const dateLabel = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone }).format(now);
  const time = new Intl.DateTimeFormat(locale, { timeStyle: "short", timeZone });

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-white/5">
      <header className="relative isolate flex flex-wrap items-end justify-between gap-x-4 gap-y-1 overflow-hidden bg-[#12100f] px-5 py-5 text-white sm:px-6">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_90%_0%,#c1272d_0%,transparent_60%),radial-gradient(circle_at_0%_130%,#006233_0%,transparent_50%)] opacity-90" />
        <div>
          <h1 className="font-display text-3xl leading-none font-extrabold sm:text-4xl">{labels.title}</h1>
          <p className="mt-1.5 text-sm text-white/75 first-letter:uppercase">{dateLabel}</p>
        </div>
        {liveCount > 0 && (
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-red px-3 py-1 text-sm font-semibold">
            <span className="size-2 animate-pulse rounded-full bg-white" />
            {liveCount} {labels.live}
          </span>
        )}
      </header>

      {groups.length === 0 ? (
        <p className="px-5 py-6 opacity-70 sm:px-6">{loaded.some(({ result }) => result.ok) ? labels.empty : labels.noData}</p>
      ) : (
        <table className="w-full text-sm">
          {groups.map(({ competition, matches }) => (
            <tbody key={competition.slug}>
              <tr className="bg-black/5 dark:bg-white/10">
                <th colSpan={4} className="px-3 py-1.5 text-start sm:px-4">
                  <Link href={`/${locale}/${competition.slug}`} className="group flex items-center gap-2">
                    <Flag country={competition.country} size={20} />
                    <span className="font-display text-base font-bold group-hover:underline">{competition.names[locale]}</span>
                    <span className="ms-auto text-xs font-semibold text-brand-red opacity-0 transition group-hover:opacity-100">
                      {labels.standings} <span aria-hidden="true" className="inline-block rtl:-scale-x-100">→</span>
                    </span>
                  </Link>
                </th>
              </tr>
              {matches.map((m) => (
                <MatchRow key={m.id} match={m} locale={locale} labels={labels} time={time} />
              ))}
            </tbody>
          ))}
        </table>
      )}
    </section>
  );
}

function MatchRow({ match: m, locale, labels, time }: { match: Match; locale: Locale; labels: Dictionary["today"]; time: Intl.DateTimeFormat }) {
  const status =
    m.status === "live" ? (
      <span className="font-bold text-brand-red">{m.minute ? `${m.minute}'` : labels.live}</span>
    ) : m.status === "finished" ? (
      <span className="opacity-60">{labels.finished}</span>
    ) : (
      <span className="opacity-60">{m.kickoff ? time.format(new Date(m.kickoff)) : "–"}</span>
    );

  return (
    <tr className="border-t border-black/5 dark:border-white/10">
      <td className="w-14 py-2 ps-3 text-xs tabular-nums sm:ps-4">{status}</td>
      <td className="px-2 py-2">
        <span className="flex items-center justify-end gap-2 text-end">
          <span className="font-medium">{teamName(m.home, locale)}</span>
          <Crest team={m.home} />
        </span>
      </td>
      <td className="w-16 py-2 text-center">
        {m.status === "scheduled" || m.homeGoals === null ? (
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
      <td className="py-2 pe-3 ps-2 sm:pe-4">
        <span className="flex items-center gap-2">
          <Crest team={m.away} />
          <span className="font-medium">{teamName(m.away, locale)}</span>
        </span>
      </td>
    </tr>
  );
}
