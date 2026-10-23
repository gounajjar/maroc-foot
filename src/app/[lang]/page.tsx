import Link from "next/link";
import { getDictionary, getLocale } from "@/dictionaries";
import { enabledCompetitions } from "@/lib/competitions";

export default async function Home() {
  const locale = await getLocale();
  const dict = await getDictionary();

  return (
    <section>
      <p className="mb-6 opacity-70">{dict.site.tagline}</p>
      <h1 className="mb-4 text-2xl font-semibold">{dict.home.competitions}</h1>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {enabledCompetitions().map((c) => (
          <li key={c.slug}>
            <Link
              href={`/${locale}/${c.slug}`}
              className="block rounded-lg border border-black/10 p-4 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
            >
              {c.names[locale]}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
