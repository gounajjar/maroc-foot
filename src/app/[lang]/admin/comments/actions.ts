"use server";

import { updateTag } from "next/cache";
import { isAdmin } from "@/lib/admin";
import { COMMENTS_TAG, deleteComment, setCommentStatus, type CommentStatus } from "@/lib/comments";
import { setBanned } from "@/lib/members";

const idOf = (form: FormData, name = "id") => {
  const id = Number(form.get(name));
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

// Every action checks the session itself: server actions can be called directly.
export async function moderate(form: FormData) {
  if (!(await isAdmin())) return;
  const id = idOf(form);
  const decision = String(form.get("decision"));
  if (!id) return;
  if (decision === "delete") await deleteComment(id);
  else if (["approved", "rejected", "pending"].includes(decision)) await setCommentStatus(id, decision as CommentStatus);
  updateTag(COMMENTS_TAG);
}

export async function banMember(form: FormData) {
  if (!(await isAdmin())) return;
  const id = idOf(form);
  if (!id) return;
  await setBanned(id, form.get("banned") === "1");
  updateTag(COMMENTS_TAG);
}
