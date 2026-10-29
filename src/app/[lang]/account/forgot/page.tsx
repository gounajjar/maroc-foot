import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/dictionaries";
import { ForgotForm } from "../forms";
import { AccountShell } from "../shell";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: `${dict.account.forgotTitle} · ${dict.site.name}`, robots: { index: false } };
}

export default async function ForgotPage() {
  const locale = await getLocale();
  const { account: t } = await getDictionary();
  return (
    <AccountShell title={t.forgotTitle} intro={t.forgotIntro}>
      <ForgotForm t={t} locale={locale} />
    </AccountShell>
  );
}
