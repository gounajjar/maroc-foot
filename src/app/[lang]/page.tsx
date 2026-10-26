import Link from "next/link";
import { getDictionary, getLocale } from "@/dictionaries";
import { enabledCompetitions, type Competition } from "@/lib/competitions";
import { Flag } from "@/components/Flag";

// Card colour per country, taken from each flag.
const cardColors: Record<string, string> = {
  MA: "#c1272d",
  GB: "#1d2a5b",
  ES: "#aa151b",
  IT: "#00703a",
  DE: "#1c1c1c",
  FR: "#0055a4",
};

const STAR = "50,19 68.2,75.1 20.5,40.4 79.5,40.4 31.8,75.1";

function PitchArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 300" className={className} aria-hidden="true" fill="none" stroke="currentColor">
      <rect x="10" y="10" width="380" height="280" rx="6" strokeWidth="3" />
      <path d="M200 10v280" strokeWidth="3" />
      <circle cx="200" cy="150" r="52" strokeWidth="3" />
      <path d="M10 85h58v130H10M390 85h-58v130h58" strokeWidth="3" />
      <polygon points={STAR} transform="translate(170 120) scale(.6)" strokeWidth="6" />
    </svg>
  );
}

export default async function Home() {
  const locale = await getLocale();
  const dict = await getDictionary();
  const [featured, ...others] = enabledCompetitions();
  const country = (c: Competition) => dict.home.countries[c.country as keyof typeof dict.home.countries];

  return (
    <div className="flex flex-col gap-10">
      <section className="relative isolate overflow-hidden rounded-2xl bg-[#12100f] px-6 py-10 text-white sm:px-10 sm:py-14">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_85%_20%,#c1272d_0%,transparent_55%),radial-gradient(circle_at_10%_110%,#006233_0%,transparent_45%)] opacity-90" />
        <PitchArt className="absolute -end-16 top-1/2 -z-10 hidden w-[460px] -translate-y-1/2 text-white/15 md:block rtl:-scale-x-100" />
        <p className="font-display text-sm font-semibold tracking-widest text-[#9fe3b9] uppercase">{dict.home.heroEyebrow}</p>
        <h1 className="font-display mt-3 max-w-xl text-4xl leading-[1.05] font-extrabold text-balance sm:text-5xl">
          {dict.home.heroTitle}
        </h1>
        <p className="mt-4 max-w-md text-white/80">{dict.home.heroText}</p>
        {featured && (
          <Link
            href={`/${locale}/${featured.slug}`}
            className="mt-7 inline-flex items-center gap-3 rounded-full bg-white py-2 ps-2 pe-5 font-semibold text-[#12100f] shadow-lg transition hover:bg-[#9fe3b9]"
          >
            <Flag country={featured.country} size={32} />
            {dict.home.heroCta}
            <span aria-hidden="true" className="rtl:-scale-x-100">→</span>
          </Link>
        )}
      </section>

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
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {others.map((c) => (
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
      </section>
    </div>
  );
}
