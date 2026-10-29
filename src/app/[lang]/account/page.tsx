import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getDictionary, getLocale } from "@/dictionaries";
import { currentMember } from "@/lib/members";
import { logout } from "./actions";
import { DeleteAccountForm, PasswordChangeButton, ResendButton } from "./forms";
import { accountCard } from "./shell";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: `${dict.account.myAccount} · ${dict.site.name}`, robots: { index: false } };
}

export default async function AccountPage({ searchParams }: PageProps<"/[lang]/account">) {
  const { account: t } = await getDictionary();
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="font-display text-3xl font-extrabold">{t.myAccount}</h1>
      <Suspense fallback={<p className="opacity-60">…</p>}>
        <Details searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Details({ searchParams }: Pick<PageProps<"/[lang]/account">, "searchParams">) {
  const locale = await getLocale();
  const { account: t } = await getDictionary();
  const member = await currentMember();
  if (!member) redirect(`/${locale}/account/login?next=/${locale}/account`);
  const reset = (await searchParams).reset === "1";
  const since = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(member.createdAt));

  return (
    <div className="space-y-5">
      {reset && <p className="font-medium text-brand-green dark:text-[#9fe3b9]">{t.resetDone}</p>}
      <section className={`${accountCard} space-y-3`}>
        <p className="font-display text-2xl font-extrabold" dir="auto">{member.pseudo}</p>
        <p className="text-sm" dir="ltr">{member.email}</p>
        <p className="text-sm opacity-70">{t.memberSince.replace("{date}", since)}</p>
        <p className="text-sm">
          {t.status} :{" "}
          {member.verified ? (
            <b className="text-brand-green dark:text-[#9fe3b9]">{t.statusOk}</b>
          ) : (
            <b className="text-brand-red">{t.statusPending}</b>
          )}
        </p>
        {!member.verified && (
          <>
            <p className="text-sm opacity-80">{t.notVerified}</p>
            <ResendButton t={t} locale={locale} />
          </>
        )}
        <div className="flex flex-wrap gap-3 pt-2">
          <PasswordChangeButton t={t} locale={locale} />
          <form action={logout}>
            <input type="hidden" name="lang" value={locale} />
            <button className="rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ring-black/20 hover:bg-black/5 dark:ring-white/25">{t.logout}</button>
          </form>
        </div>
      </section>
      <section className={`${accountCard} space-y-3`}>
        <h2 className="font-display text-xl font-extrabold">{t.delete}</h2>
        <p className="text-sm opacity-80">{t.deleteHint}</p>
        <DeleteAccountForm t={t} locale={locale} />
      </section>
    </div>
  );
}
