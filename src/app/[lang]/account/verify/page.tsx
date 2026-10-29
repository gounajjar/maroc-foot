import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getDictionary, getLocale } from "@/dictionaries";
import { hasDatabase } from "@/lib/articles/db";
import { consumeToken, markVerified } from "@/lib/members";
import { button } from "../forms";
import { AccountShell } from "../shell";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: `${dict.account.myAccount} · ${dict.site.name}`, robots: { index: false } };
}

export default async function VerifyPage({ searchParams }: PageProps<"/[lang]/account/verify">) {
  const { account: t } = await getDictionary();
  return (
    <AccountShell title={t.myAccount}>
      <Suspense fallback={<p className="opacity-60">…</p>}>
        <Result searchParams={searchParams} />
      </Suspense>
    </AccountShell>
  );
}

// Opening the link from the validation e-mail validates the account.
async function Result({ searchParams }: Pick<PageProps<"/[lang]/account/verify">, "searchParams">) {
  const locale = await getLocale();
  const dict = await getDictionary();
  const t = dict.account;
  const token = (await searchParams).token;
  const id = hasDatabase() && typeof token === "string" ? await consumeToken(token, "verify") : null;
  if (id) await markVerified(id);
  return (
    <div className="space-y-4">
      <p className={`font-medium ${id ? "text-brand-green dark:text-[#9fe3b9]" : "text-brand-red"}`}>{id ? t.verified : t.badLink}</p>
      <Link href={id ? `/${locale}/articles` : `/${locale}/account`} className={`${button} inline-block`}>
        {id ? dict.articles.title : t.myAccount}
      </Link>
    </div>
  );
}
