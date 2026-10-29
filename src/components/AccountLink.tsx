import Link from "next/link";
import { currentMember } from "@/lib/members";
import type { Locale } from "@/lib/i18n";

const style = "flex items-center gap-1.5 text-sm font-semibold opacity-90 hover:opacity-100";

// A person icon; on phones the header only has room for the icon.
function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  );
}

// Header link: the member's pseudo once signed in, otherwise "Se connecter".
export async function AccountLink({ locale, label }: { locale: Locale; label: string }) {
  const member = await currentMember().catch(() => null);
  if (!member) return <AccountLinkFallback locale={locale} label={label} />;
  return (
    <Link href={`/${locale}/account`} className={style} title={member.pseudo}>
      <PersonIcon />
      <span className="hidden max-w-32 truncate sm:inline" dir="auto">{member.pseudo}</span>
    </Link>
  );
}

export function AccountLinkFallback({ locale, label }: { locale: Locale; label: string }) {
  return (
    <Link href={`/${locale}/account/login`} className={style} aria-label={label} title={label}>
      <PersonIcon />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
