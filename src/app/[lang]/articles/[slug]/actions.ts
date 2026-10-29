"use server";

import { dictionaryFor } from "@/dictionaries";
import { addComment, MAX_COMMENT, reportComment } from "@/lib/comments";
import { hasLocale, type Locale } from "@/lib/i18n";
import { currentMember } from "@/lib/members";
import { getPublishedPost } from "@/lib/posts";

export type CommentState = { ok: boolean; message: string } | null;

const field = (form: FormData, name: string) => String(form.get(name) ?? "").trim();
const langOf = (form: FormData): Locale => {
  const lang = field(form, "lang");
  return hasLocale(lang) ? lang : "fr";
};

export async function postComment(_: CommentState, form: FormData): Promise<CommentState> {
  const lang = langOf(form);
  const t = (await dictionaryFor(lang)).comments;
  const member = await currentMember();
  if (!member) return { ok: false, message: t.loginToComment.replace("{login}", "").replace("{signup}", "").trim() };
  if (!member.verified) return { ok: false, message: t.verifyToComment };
  const body = field(form, "body").replace(/\n{3,}/g, "\n\n");
  if (body.length < 2 || body.length > MAX_COMMENT) return { ok: false, message: t.errEmpty };
  const postId = Number(field(form, "postId"));
  if (!(await getPublishedPost(postId, lang))) return { ok: false, message: t.errEmpty };
  const parent = Number(field(form, "parentId"));
  const added = await addComment(postId, member.id, Number.isSafeInteger(parent) && parent > 0 ? parent : null, body);
  // Nothing appears for others until approval, so no cache to refresh here.
  return added ? { ok: true, message: t.pending } : { ok: false, message: t.errTooFast };
}

export async function report(_: CommentState, form: FormData): Promise<CommentState> {
  const t = (await dictionaryFor(langOf(form))).comments;
  const member = await currentMember();
  const id = Number(field(form, "commentId"));
  if (!member || !Number.isSafeInteger(id)) return null;
  await reportComment(id, member.id);
  return { ok: true, message: t.reported };
}
