import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Suspense } from "react";
import { Barlow_Condensed, Geist, Reem_Kufi } from "next/font/google";
import { AdSlot } from "@/components/AdSlot";
import { LeagueMenu, LeagueMenuList } from "@/components/LeagueMenu";
import { LogoMark } from "@/components/Logo";
import { getDictionary, getLocale } from "@/dictionaries";
import { adEnabled, adsenseClient } from "@/lib/ads";
import { enabledCompetitions } from "@/lib/competitions";
import { isRtl, locales } from "@/lib/i18n";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["600", "800"],
});

const reemKufi = Reem_Kufi({
  variable: "--font-reem-kufi",
  subsets: ["arabic"],
  weight: ["500", "700"],
});

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  const client = adsenseClient();
  return {
    title: dict.site.name,
    description: dict.site.tagline,
    // Lets AdSense check that the site belongs to the account.
    other: client ? { "google-adsense-account": client } : undefined,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();
  const dict = await getDictionary();
  const client = adsenseClient();
  // The page widens on large screens to make room for the sidebar ad.
  const sidebar = adEnabled("sidebar");
  const leagues = enabledCompetitions().map((c) => ({ href: `/${locale}/${c.slug}`, name: c.names[locale], country: c.country }));

  return (
    <html lang={locale} dir={isRtl(locale) ? "rtl" : "ltr"} className={`${geistSans.variable} ${barlow.variable} ${reemKufi.variable} h-full antialiased`}>
      <body className={`min-h-full flex flex-col [--page-width:64rem] ${sidebar ? "xl:[--page-width:84rem]" : ""}`}>
        <header className="bg-brand-red text-white">
          <nav className="mx-auto flex max-w-(--page-width) items-center justify-between gap-4 px-4 py-3">
            <Link href={`/${locale}`} aria-label={dict.site.name} className="flex items-center gap-3">
              <LogoMark size={44} inverse />
              <span className="font-display text-2xl leading-none font-extrabold tracking-wide uppercase">
                Maroc<span className="text-[#9fe3b9]">·</span>Foot
              </span>
            </Link>
            <Link href={`/${locale}/articles`} className="ms-auto font-display text-lg font-semibold tracking-wide uppercase opacity-90 hover:opacity-100">
              {dict.nav.news}
            </Link>
            <ul className="flex gap-3 text-sm">
              {locales.map((l) => (
                <li key={l}>
                  <Link href={`/${l}`} className={l === locale ? "font-semibold underline underline-offset-4" : "opacity-80 hover:opacity-100"}>
                    {l.toUpperCase()}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>
        <Suspense fallback={<LeagueMenuList items={leagues} label={dict.nav.competitions} />}>
          <LeagueMenu items={leagues} label={dict.nav.competitions} />
        </Suspense>
        <AdSlot placement="banner" className="mx-auto mt-4 w-full max-w-[728px] px-4" />
        <div className="mx-auto flex w-full max-w-(--page-width) flex-1 gap-8 px-4 py-6">
          <main className="min-w-0 flex-1">{children}</main>
          {sidebar && (
            <div className="hidden w-[300px] shrink-0 xl:block">
              <AdSlot placement="sidebar" className="sticky top-4" />
            </div>
          )}
        </div>
        {client && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
