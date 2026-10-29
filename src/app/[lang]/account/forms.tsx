"use client";

import Link from "next/link";
import { useActionState, type ReactNode } from "react";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";
import {
  deleteAccount,
  forgot,
  login,
  requestPasswordChange,
  resendVerification,
  resetPassword,
  signup,
  type AccountState,
} from "./actions";

type T = Dictionary["account"];

export const input =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-[#12100f] outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20";
export const button = "rounded-full bg-brand-red px-5 py-2 font-semibold text-white transition hover:bg-[#a01f25] disabled:opacity-50";
const secondary = "rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ring-black/20 hover:bg-black/5 disabled:opacity-50 dark:ring-white/25 dark:hover:bg-white/10";

export function Status({ state }: { state: AccountState }) {
  if (!state?.message) return null;
  return (
    <p role="status" className={`text-sm font-medium ${state.ok ? "text-brand-green dark:text-[#9fe3b9]" : "text-brand-red"}`}>
      {state.message}
    </p>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      {children}
      {hint && <span className="text-xs opacity-60">{hint}</span>}
    </label>
  );
}

export function SignupForm({ t, locale }: { t: T; locale: Locale }) {
  const [state, action, pending] = useActionState(signup, null);
  if (state?.ok) return <p className="rounded-xl bg-brand-green/10 p-4 font-medium text-brand-green dark:text-[#9fe3b9]">{state.message}</p>;
  const [before, after] = t.accept.split("{privacy}");
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="lang" value={locale} />
      <Field label={t.email}>
        <input type="email" name="email" required maxLength={200} autoComplete="email" dir="ltr" className={input} />
      </Field>
      <Field label={t.pseudo}>
        <input type="text" name="pseudo" required minLength={3} maxLength={24} autoComplete="nickname" dir="auto" className={input} />
      </Field>
      <Field label={t.password} hint={t.passwordHint}>
        <input type="password" name="password" required minLength={8} autoComplete="new-password" className={input} />
      </Field>
      {/* Hidden from people: robots that fill every field are ignored. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="accept" required className="mt-0.5 size-4 shrink-0" />
        <span>
          {before}
          <Link href={`/${locale}/privacy`} target="_blank" className="text-brand-red underline">
            {t.privacyLink}
          </Link>
          {after}
        </span>
      </label>
      <button disabled={pending} className={`${button} self-start`}>
        {t.signup}
      </button>
      <Status state={state} />
    </form>
  );
}

export function LoginForm({ t, locale, next }: { t: T; locale: Locale; next: string }) {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="lang" value={locale} />
      <input type="hidden" name="next" value={next} />
      <Field label={t.email}>
        <input type="email" name="email" required autoComplete="email" dir="ltr" className={input} />
      </Field>
      <Field label={t.password}>
        <input type="password" name="password" required autoComplete="current-password" className={input} />
      </Field>
      <button disabled={pending} className={`${button} self-start`}>
        {t.login}
      </button>
      <Status state={state} />
    </form>
  );
}

export function ForgotForm({ t, locale }: { t: T; locale: Locale }) {
  const [state, action, pending] = useActionState(forgot, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="lang" value={locale} />
      <Field label={t.email}>
        <input type="email" name="email" required autoComplete="email" dir="ltr" className={input} />
      </Field>
      <button disabled={pending} className={`${button} self-start`}>
        {t.send}
      </button>
      <Status state={state} />
    </form>
  );
}

export function ResetForm({ t, locale, token }: { t: T; locale: Locale; token: string }) {
  const [state, action, pending] = useActionState(resetPassword, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="lang" value={locale} />
      <input type="hidden" name="token" value={token} />
      <Field label={t.newPassword} hint={t.passwordHint}>
        <input type="password" name="password" required minLength={8} autoComplete="new-password" className={input} />
      </Field>
      <button disabled={pending} className={`${button} self-start`}>
        {t.save}
      </button>
      <Status state={state} />
    </form>
  );
}

export function ResendButton({ t, locale }: { t: T; locale: Locale }) {
  const [state, action, pending] = useActionState(resendVerification, null);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="lang" value={locale} />
      <button disabled={pending} className={secondary}>
        {t.resend}
      </button>
      <Status state={state} />
    </form>
  );
}

export function PasswordChangeButton({ t, locale }: { t: T; locale: Locale }) {
  const [state, action, pending] = useActionState(requestPasswordChange, null);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="lang" value={locale} />
      <button disabled={pending} className={secondary}>
        {t.changePassword}
      </button>
      <Status state={state} />
    </form>
  );
}

export function DeleteAccountForm({ t, locale }: { t: T; locale: Locale }) {
  const [state, action, pending] = useActionState(deleteAccount, null);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="lang" value={locale} />
      <Field label={t.deleteConfirm}>
        <input type="text" name="confirm" required autoComplete="off" className={`${input} w-48`} />
      </Field>
      <button disabled={pending} className="rounded-full px-4 py-2 text-sm font-semibold text-brand-red ring-1 ring-brand-red/50 hover:bg-brand-red hover:text-white">
        {t.delete}
      </button>
      <Status state={state} />
    </form>
  );
}
