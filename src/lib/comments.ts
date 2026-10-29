import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db, hasDatabase } from "@/lib/articles/db";

// Comments of members on the site's own posts. Every comment waits for the
// owner's approval in the admin page before it is shown.
export type CommentStatus = "pending" | "approved" | "rejected";
export type Comment = { id: number; postId: number; parentId: number | null; pseudo: string; memberId: number; body: string; status: CommentStatus; createdAt: string };

export const COMMENTS_TAG = "comments";
export const MAX_COMMENT = 2000;

type Row = { id: number; post_id: number; parent_id: number | null; pseudo: string; member_id: number; body: string; status: CommentStatus; created_at: Date };
const toComment = (r: Row): Comment => ({
  id: r.id,
  postId: r.post_id,
  parentId: r.parent_id,
  pseudo: r.pseudo,
  memberId: r.member_id,
  body: r.body,
  status: r.status,
  createdAt: r.created_at.toISOString(),
});

export async function approvedComments(postId: number): Promise<Comment[]> {
  "use cache";
  cacheTag(COMMENTS_TAG);
  cacheLife("hours");
  if (!hasDatabase()) return [];
  const sql = await db();
  const rows = await sql<Row[]>`
    select c.id, c.post_id, c.parent_id, m.pseudo, c.member_id, c.body, c.status, c.created_at
    from comments c join members m on m.id = c.member_id
    where c.post_id = ${postId} and c.status = 'approved' and not m.banned
    order by c.created_at`;
  return rows.map(toComment);
}

// A member sees their own comments still waiting for approval.
export async function pendingCommentsOf(postId: number, memberId: number): Promise<Comment[]> {
  const sql = await db();
  const rows = await sql<Row[]>`
    select c.id, c.post_id, c.parent_id, m.pseudo, c.member_id, c.body, c.status, c.created_at
    from comments c join members m on m.id = c.member_id
    where c.post_id = ${postId} and c.member_id = ${memberId} and c.status = 'pending'
    order by c.created_at`;
  return rows.map(toComment);
}

// Returns false when the member posted less than 30 seconds ago.
export async function addComment(postId: number, memberId: number, parentId: number | null, body: string): Promise<boolean> {
  const sql = await db();
  const [recent] = await sql`select 1 from comments where member_id = ${memberId} and created_at > now() - interval '30 seconds'`;
  if (recent) return false;
  // Replies go one level deep: answering a reply answers its parent.
  let parent: number | null = null;
  if (parentId) {
    const [p] = await sql<{ id: number; parent_id: number | null }[]>`select id, parent_id from comments where id = ${parentId} and post_id = ${postId}`;
    parent = p ? (p.parent_id ?? p.id) : null;
  }
  await sql`insert into comments (post_id, member_id, parent_id, body) values (${postId}, ${memberId}, ${parent}, ${body})`;
  return true;
}

export async function reportComment(commentId: number, memberId: number) {
  const sql = await db();
  await sql`insert into comment_reports (comment_id, member_id) values (${commentId}, ${memberId}) on conflict do nothing`;
}

// --- Admin -----------------------------------------------------------------

export type ModeratedComment = Comment & { email: string; reports: number; postTitle: string };

export async function commentsForModeration(status: CommentStatus | "reported"): Promise<ModeratedComment[]> {
  const sql = await db();
  const rows = await sql<(Row & { email: string; reports: number; post_title: string | null })[]>`
    select c.id, c.post_id, c.parent_id, m.pseudo, c.member_id, c.body, c.status, c.created_at, m.email,
      (select count(*)::int from comment_reports r where r.comment_id = c.id) as reports,
      (select t.title from post_translations t where t.post_id = c.post_id order by t.lang = 'fr' desc limit 1) as post_title
    from comments c join members m on m.id = c.member_id
    where ${status === "reported" ? sql`c.status = 'approved' and exists (select 1 from comment_reports r where r.comment_id = c.id)` : sql`c.status = ${status}`}
    order by c.created_at ${status === "pending" ? sql`asc` : sql`desc`} limit 200`;
  return rows.map((r) => ({ ...toComment(r), email: r.email, reports: r.reports, postTitle: r.post_title ?? "" }));
}

export async function commentCounts(): Promise<{ pending: number; reported: number }> {
  if (!hasDatabase()) return { pending: 0, reported: 0 };
  const sql = await db();
  const [row] = await sql<{ pending: number; reported: number }[]>`
    select (select count(*)::int from comments where status = 'pending') as pending,
      (select count(distinct r.comment_id)::int from comment_reports r join comments c on c.id = r.comment_id where c.status = 'approved') as reported`;
  return row;
}

export async function setCommentStatus(id: number, status: CommentStatus) {
  const sql = await db();
  await sql`update comments set status = ${status} where id = ${id}`;
  // A decision clears the reports: a comment kept online starts again from zero.
  await sql`delete from comment_reports where comment_id = ${id}`;
}

export async function deleteComment(id: number) {
  const sql = await db();
  await sql`delete from comments where id = ${id}`;
}
