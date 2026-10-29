import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary, getLocale } from "@/dictionaries";
import { SignupForm } from "../forms";
import { AccountShell } from "../shell";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: `${dict.account.signupTitle} · ${dict.site.name}`, robots: { index: false } };
}

export default async function SignupPage() {
  const locale = await getLocale();
  const { account: t } = await getDictionary();
  return (
    <AccountShell title={t.signupTitle} intro={t.signupIntro}>
      <SignupForm t={t} locale={locale} />
      <p className="mt-5 text-sm">
        {t.haveAccount}{" "}
        <Link href={`/${locale}/account/login`} className="font-semibold text-brand-red hover:underline">
          {t.login}
        </Link>
      </p>
    </AccountShell>
  );
}
