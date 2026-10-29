"use client";

import { useActionState, useState } from "react";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";
import { postComment, report } from "./actions";

type T = Dictionary["comments"];

export function CommentForm({ t, locale, postId, parentId, onCancel }: { t: T; locale: Locale; postId: number; parentId?: number; onCancel?: () => void }) {
  const [state, action, pending] = useActionState(postComment, null);
  if (state?.ok) return <p className="rounded-xl bg-brand-green/10 p-3 text-sm font-medium text-brand-green dark:text-[#9fe3b9]">{state.message}</p>;
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="lang" value={locale} />
      <input type="hidden" name="postId" value={postId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <textarea
        name="body"
        required
        minLength={2}
        maxLength={2000}
        rows={parentId ? 3 : 4}
        dir="auto"
        placeholder={t.placeholder}
        className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-[#12100f] outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button disabled={pending} className="rounded-full bg-brand-red px-5 py-1.5 font-semibold text-white hover:bg-[#a01f25] disabled:opacity-50">
          {t.send}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-sm underline opacity-70">
            {t.cancel}
          </button>
        )}
        {state?.message && <p role="status" className="text-sm font-medium text-brand-red">{state.message}</p>}
      </div>
    </form>
  );
}

// "Répondre" and "Signaler" under a comment, for signed-in members.
export function CommentActions({ t, locale, postId, commentId, canReply }: { t: T; locale: Locale; postId: number; commentId: number; canReply: boolean }) {
  const [replying, setReplying] = useState(false);
  const [state, action, pending] = useActionState(report, null);
  return (
    <div className="mt-1 space-y-2">
      <div className="flex gap-4 text-xs font-semibold">
        {canReply && (
          <button type="button" onClick={() => setReplying((r) => !r)} className="text-brand-green hover:underline dark:text-[#9fe3b9]">
            {t.reply}
          </button>
        )}
        {state?.ok ? (
          <span className="opacity-60">{state.message}</span>
        ) : (
          <form action={action}>
            <input type="hidden" name="lang" value={locale} />
            <input type="hidden" name="commentId" value={commentId} />
            <button disabled={pending} className="opacity-50 hover:underline hover:opacity-100">
              {t.report}
            </button>
          </form>
        )}
      </div>
      {replying && <CommentForm t={t} locale={locale} postId={postId} parentId={commentId} onCancel={() => setReplying(false)} />}
    </div>
  );
}
