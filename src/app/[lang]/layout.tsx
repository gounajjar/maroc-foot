import type { Metadata } from "next";
import Link from "next/link";
import { Barlow_Condensed, Geist, Reem_Kufi } from "next/font/google";
import { LogoMark } from "@/components/Logo";
import { getDictionary, getLocale } from "@/dictionaries";
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
  return { title: dict.site.name, description: dict.site.tagline };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();
  const dict = await getDictionary();

  return (
    <html lang={locale} dir={isRtl(locale) ? "rtl" : "ltr"} className={`${geistSans.variable} ${barlow.variable} ${reemKufi.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="bg-brand-red text-white">
          <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <Link href={`/${locale}`} aria-label={dict.site.name} className="flex items-center gap-3">
              <LogoMark size={44} inverse />
              <span className="font-display text-2xl leading-none font-extrabold tracking-wide uppercase">
                Maroc<span className="text-[#9fe3b9]">·</span>Foot
              </span>
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
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
