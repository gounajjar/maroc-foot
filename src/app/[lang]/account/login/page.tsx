import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getDictionary, getLocale } from "@/dictionaries";
import { LoginForm } from "../forms";
import { AccountShell } from "../shell";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: `${dict.account.loginTitle} · ${dict.site.name}`, robots: { index: false } };
}

export default async function LoginPage({ searchParams }: PageProps<"/[lang]/account/login">) {
  const locale = await getLocale();
  const { account: t } = await getDictionary();
  return (
    <AccountShell title={t.loginTitle}>
      <Suspense fallback={<LoginForm t={t} locale={locale} next="" />}>
        <Form searchParams={searchParams} />
      </Suspense>
      <div className="mt-5 flex flex-col gap-2 text-sm">
        <Link href={`/${locale}/account/forgot`} className="text-brand-red hover:underline">
          {t.forgot}
        </Link>
        <p>
          {t.noAccount}{" "}
          <Link href={`/${locale}/account/signup`} className="font-semibold text-brand-red hover:underline">
            {t.signup}
          </Link>
        </p>
      </div>
    </AccountShell>
  );
}

// Where to go back after signing in, e.g. the article being read.
async function Form({ searchParams }: Pick<PageProps<"/[lang]/account/login">, "searchParams">) {
  const locale = await getLocale();
  const { account: t } = await getDictionary();
  const next = (await searchParams).next;
  return <LoginForm t={t} locale={locale} next={typeof next === "string" ? next : ""} />;
}
