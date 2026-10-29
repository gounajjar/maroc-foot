import Link from "next/link";
import type { Dictionary } from "@/dictionaries";
import { approvedComments, pendingCommentsOf, type Comment } from "@/lib/comments";
import type { Locale } from "@/lib/i18n";
import { currentMember } from "@/lib/members";
import { CommentActions, CommentForm } from "./comment-forms";

// Discussion under a post: approved comments with one level of replies, the
// visitor's own comments waiting for approval, and the form to comment.
export async function Comments({ postId, path, locale, dict }: { postId: number; path: string; locale: Locale; dict: Dictionary }) {
  const t = dict.comments;
  const member = await currentMember();
  const approved = await approvedComments(postId);
  const mine = member ? await pendingCommentsOf(postId, member.id) : [];
  const all = [...approved, ...mine];
  const top = all.filter((c) => c.parentId === null).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const replies = (id: number) => all.filter((c) => c.parentId === id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const canAct = member?.verified ?? false;

  const item = (c: Comment, reply: boolean) => (
    <div className={`rounded-xl bg-white p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10 ${c.status === "pending" ? "opacity-70" : ""}`}>
      <p className="text-sm">
        <b dir="auto">{c.pseudo}</b>{" "}
        <span className="opacity-60">
          · <bdi>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Casablanca" }).format(new Date(c.createdAt))}</bdi>
        </span>
        {c.status === "pending" && <span className="ms-2 rounded-full bg-black/10 px-2 py-0.5 text-xs dark:bg-white/15">{t.yourPending}</span>}
      </p>
      <p dir="auto" className="mt-1 whitespace-pre-line">{c.body}</p>
      {canAct && c.status === "approved" && <CommentActions t={t} locale={locale} postId={postId} commentId={c.id} canReply={!reply} />}
    </div>
  );

  const loginLink = (
    <Link href={`/${locale}/account/login?next=${encodeURIComponent(path)}`} className="font-semibold text-brand-red underline">
      {dict.account.login}
    </Link>
  );
  const signupLink = (
    <Link href={`/${locale}/account/signup`} className="font-semibold text-brand-red underline">
      {dict.account.signup.toLowerCase()}
    </Link>
  );
  const [beforeLogin, rest] = t.loginToComment.split("{login}");
  const [between, afterSignup] = rest.split("{signup}");

  return (
    <section id="comments" className="space-y-4 border-t border-black/10 pt-6 dark:border-white/10">
      <h2 className="font-display text-2xl font-extrabold">
        {t.title} <span className="opacity-50">({approved.length})</span>
      </h2>
      {top.length === 0 && <p className="opacity-70">{t.none}</p>}
      <ul className="space-y-3">
        {top.map((c) => (
          <li key={c.id} className="space-y-2">
            {item(c, false)}
            {replies(c.id).length > 0 && (
              <ul className="ms-6 space-y-2 border-s-2 border-brand-green/30 ps-4">
                {replies(c.id).map((r) => (
                  <li key={r.id}>{item(r, true)}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      <div className="rounded-xl bg-black/[.03] p-4 dark:bg-white/5">
        {!member ? (
          <p>
            {beforeLogin}
            {loginLink}
            {between}
            {signupLink}
            {afterSignup}
          </p>
        ) : !member.verified ? (
          <p>{t.verifyToComment}</p>
        ) : (
          <>
            <CommentForm t={t} locale={locale} postId={postId} />
            <p className="mt-2 text-xs opacity-60">{t.rules}</p>
          </>
        )}
      </div>
    </section>
  );
}
