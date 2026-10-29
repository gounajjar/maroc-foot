"use server";

import { redirect } from "next/navigation";
import { dictionaryFor } from "@/dictionaries";
import { hasDatabase } from "@/lib/articles/db";
import { hasLocale, isRtl, type Locale } from "@/lib/i18n";
import {
  consumeToken,
  createMember,
  createToken,
  currentMember,
  deleteMember,
  endSession,
  findMemberByEmail,
  markVerified,
  normalizeEmail,
  pseudoTaken,
  purgeUnverified,
  setPassword,
  startSession,
  verifyLogin,
  type Member,
  type TokenKind,
} from "@/lib/members";
import { canSendMail, sendMail } from "@/lib/members/mail";
import { siteUrl } from "@/lib/site";

export type AccountState = { ok: boolean; message: string } | null;

const field = (form: FormData, name: string) => String(form.get(name) ?? "").trim();
const langOf = (form: FormData): Locale => {
  const lang = field(form, "lang");
  return hasLocale(lang) ? lang : "fr";
};
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PSEUDO = /^[\p{L}\p{N}_\- ]{3,24}$/u;

// Only addresses of this site are followed after signing in.
const safeNext = (value: string, lang: Locale) => (/^\/(fr|ar|en)(\/[^/\\]|$)/.test(value) ? value : `/${lang}`);

// Sends the validation or password link, in the member's language.
async function mailLink(member: Pick<Member, "id" | "email" | "pseudo">, kind: TokenKind, lang: Locale): Promise<"sent" | "wait"> {
  const token = await createToken(member.id, kind);
  if (!token) return "wait";
  const t = (await dictionaryFor(lang)).account;
  const v = kind === "verify";
  await sendMail({
    to: member.email,
    subject: v ? t.mailVerifySubject : t.mailResetSubject,
    intro: (v ? t.mailVerifyIntro : t.mailResetIntro).replace("{pseudo}", member.pseudo),
    button: v ? t.mailVerifyButton : t.mailResetButton,
    link: `${siteUrl}/${lang}/account/${v ? "verify" : "reset"}?token=${token}`,
    outro: v ? t.mailVerifyOutro : t.mailResetOutro,
    rtl: isRtl(lang),
  });
  return "sent";
}

export async function signup(_: AccountState, form: FormData): Promise<AccountState> {
  const lang = langOf(form);
  const t = (await dictionaryFor(lang)).account;
  // Field left empty by people, filled in by robots.
  if (field(form, "website")) return { ok: true, message: t.checkMail };
  if (!hasDatabase() || (!canSendMail() && process.env.NODE_ENV === "production")) return { ok: false, message: t.errClosed };

  const email = normalizeEmail(field(form, "email"));
  const pseudo = field(form, "pseudo").replace(/\s+/g, " ");
  const password = String(form.get("password") ?? "");
  if (!EMAIL.test(email) || email.length > 200) return { ok: false, message: t.errEmail };
  if (!PSEUDO.test(pseudo)) return { ok: false, message: t.errPseudo };
  if (password.length < 8 || password.length > 200) return { ok: false, message: t.errPassword };
  if (form.get("accept") !== "on") return { ok: false, message: t.errAccept };

  await purgeUnverified();
  if (await findMemberByEmail(email)) return { ok: false, message: t.errEmailTaken };
  if (await pseudoTaken(pseudo)) return { ok: false, message: t.errPseudoTaken };

  const id = await createMember(email, pseudo, password, lang);
  try {
    await mailLink({ id, email, pseudo }, "verify", lang);
  } catch (err) {
    console.error(err);
    await deleteMember(id);
    return { ok: false, message: t.errMail };
  }
  await startSession(id);
  return { ok: true, message: t.checkMail };
}

export async function login(_: AccountState, form: FormData): Promise<AccountState> {
  const lang = langOf(form);
  const t = (await dictionaryFor(lang)).account;
  if (!hasDatabase()) return { ok: false, message: t.errClosed };
  const member = await verifyLogin(field(form, "email"), String(form.get("password") ?? ""));
  if (!member) return { ok: false, message: t.errLogin };
  if (member.banned) return { ok: false, message: t.errBanned };
  await startSession(member.id);
  redirect(safeNext(field(form, "next"), lang));
}

export async function logout(form: FormData) {
  await endSession();
  redirect(`/${langOf(form)}`);
}

export async function forgot(_: AccountState, form: FormData): Promise<AccountState> {
  const lang = langOf(form);
  const t = (await dictionaryFor(lang)).account;
  if (!hasDatabase()) return { ok: false, message: t.errClosed };
  const member = await findMemberByEmail(field(form, "email"));
  // Same answer whether the address has an account or not.
  if (member && !member.banned) {
    try {
      await mailLink(member, "reset", lang);
    } catch (err) {
      console.error(err);
      return { ok: false, message: t.errMail };
    }
  }
  return { ok: true, message: t.forgotSent };
}

export async function resetPassword(_: AccountState, form: FormData): Promise<AccountState> {
  const lang = langOf(form);
  const t = (await dictionaryFor(lang)).account;
  const password = String(form.get("password") ?? "");
  if (password.length < 8 || password.length > 200) return { ok: false, message: t.errPassword };
  const id = await consumeToken(field(form, "token"), "reset");
  if (!id) return { ok: false, message: t.badLink };
  await setPassword(id, password);
  // The link proves the address too.
  await markVerified(id);
  await startSession(id);
  redirect(`/${lang}/account?reset=1`);
}

export async function resendVerification(_: AccountState, form: FormData): Promise<AccountState> {
  const lang = langOf(form);
  const t = (await dictionaryFor(lang)).account;
  const member = await currentMember();
  if (!member || member.verified) return null;
  try {
    return (await mailLink(member, "verify", lang)) === "sent" ? { ok: true, message: t.resent } : { ok: false, message: t.wait };
  } catch (err) {
    console.error(err);
    return { ok: false, message: t.errMail };
  }
}

export async function requestPasswordChange(_: AccountState, form: FormData): Promise<AccountState> {
  const lang = langOf(form);
  const t = (await dictionaryFor(lang)).account;
  const member = await currentMember();
  if (!member) return null;
  try {
    return (await mailLink(member, "reset", lang)) === "sent" ? { ok: true, message: t.forgotSent } : { ok: false, message: t.wait };
  } catch (err) {
    console.error(err);
    return { ok: false, message: t.errMail };
  }
}

export async function deleteAccount(_: AccountState, form: FormData): Promise<AccountState> {
  const lang = langOf(form);
  const t = (await dictionaryFor(lang)).account;
  const member = await currentMember();
  if (!member) return null;
  if (field(form, "confirm").toUpperCase() !== t.deleteWord.toUpperCase()) return { ok: false, message: t.deleteConfirm };
  await deleteMember(member.id);
  await endSession();
  redirect(`/${lang}?deleted=1`);
}
