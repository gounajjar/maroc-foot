import type { Metadata } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";
import { getDictionary, getLocale } from "@/dictionaries";
import { isRtl, locales } from "@/lib/i18n";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
    <html lang={locale} dir={isRtl(locale) ? "rtl" : "ltr"} className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-black/10 dark:border-white/15">
          <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <Link href={`/${locale}`} className="text-lg font-semibold">
              {dict.site.name}
            </Link>
            <ul className="flex gap-3 text-sm">
              {locales.map((l) => (
                <li key={l}>
                  <Link href={`/${l}`} className={l === locale ? "font-semibold underline" : "opacity-70"}>
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
