import type { Metadata } from "next";
import { Suspense } from "react";
import { getDictionary, getLocale } from "@/dictionaries";
import { ResetForm } from "../forms";
import { AccountShell } from "../shell";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: `${dict.account.resetTitle} · ${dict.site.name}`, robots: { index: false } };
}

// The link from the e-mail is only used when the form is sent, so that mail
// scanners opening it in advance do not spend it.
export default async function ResetPage({ searchParams }: PageProps<"/[lang]/account/reset">) {
  const { account: t } = await getDictionary();
  return (
    <AccountShell title={t.resetTitle}>
      <Suspense>
        <Form searchParams={searchParams} />
      </Suspense>
    </AccountShell>
  );
}

async function Form({ searchParams }: Pick<PageProps<"/[lang]/account/reset">, "searchParams">) {
  const locale = await getLocale();
  const { account: t } = await getDictionary();
  const token = (await searchParams).token;
  return <ResetForm t={t} locale={locale} token={typeof token === "string" ? token : ""} />;
}
