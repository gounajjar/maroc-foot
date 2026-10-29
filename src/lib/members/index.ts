import "server-only";
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { db, hasDatabase } from "@/lib/articles/db";
import { hasLocale, type Locale } from "@/lib/i18n";

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

export type Member = { id: number; email: string; pseudo: string; lang: Locale; verified: boolean; banned: boolean; createdAt: string };

type MemberRow = { id: number; email: string; pseudo: string; lang: string; verified_at: Date | null; banned: boolean; created_at: Date };
const toMember = (r: MemberRow): Member => ({
  id: r.id,
  email: r.email,
  pseudo: r.pseudo,
  lang: hasLocale(r.lang) ? r.lang : "fr",
  verified: r.verified_at !== null,
  banned: r.banned,
  createdAt: r.created_at.toISOString(),
});

const COOKIE = "mf_member";
const SESSION_DAYS = 30;
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const newToken = () => randomBytes(32).toString("base64url");

// Passwords are stored as "salt:hash" with scrypt; never in clear.
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  return `${salt.toString("hex")}:${(await scrypt(password, salt, 64)).toString("hex")}`;
}

async function checkPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = await scrypt(password, Buffer.from(salt, "hex"), 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function findMemberByEmail(email: string): Promise<(Member & { passwordHash: string }) | null> {
  const sql = await db();
  const [row] = await sql<(MemberRow & { password_hash: string })[]>`
    select id, email, pseudo, lang, verified_at, banned, created_at, password_hash from members where email = ${normalizeEmail(email)}`;
  return row ? { ...toMember(row), passwordHash: row.password_hash } : null;
}

export async function pseudoTaken(pseudo: string, exceptId = 0) {
  const sql = await db();
  const [row] = await sql`select 1 from members where lower(pseudo) = lower(${pseudo}) and id <> ${exceptId}`;
  return row !== undefined;
}

// Accounts never validated are removed after a week, which also frees
// their address and pseudo. Run before each sign-up.
export async function purgeUnverified() {
  const sql = await db();
  await sql`delete from members where verified_at is null and created_at < now() - interval '7 days'`;
}

export async function createMember(email: string, pseudo: string, password: string, lang: Locale): Promise<number> {
  const sql = await db();
  const [row] = await sql<{ id: number }[]>`
    insert into members (email, pseudo, password_hash, lang)
    values (${normalizeEmail(email)}, ${pseudo}, ${await hashPassword(password)}, ${lang}) returning id`;
  return row.id;
}

// The password is checked even for an unknown address, so that response time
// does not tell which addresses have an account.
const DUMMY_HASH = "00000000000000000000000000000000:" + "00".repeat(64);
export async function verifyLogin(email: string, password: string) {
  const member = await findMemberByEmail(email);
  const ok = await checkPassword(password, member?.passwordHash ?? DUMMY_HASH);
  return ok && member ? member : null;
}

// --- Sessions -------------------------------------------------------------

export async function startSession(memberId: number) {
  const sql = await db();
  const token = newToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await sql`insert into member_sessions (token_hash, member_id, expires_at) values (${sha256(token)}, ${memberId}, ${expires})`;
  await sql`delete from member_sessions where expires_at < now()`;
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token && hasDatabase()) {
    const sql = await db();
    await sql`delete from member_sessions where token_hash = ${sha256(token)}`;
  }
  jar.delete(COOKIE);
}

// The signed-in visitor, or null. Banned members are signed out.
export async function currentMember(): Promise<Member | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || !hasDatabase()) return null;
  const sql = await db();
  const [row] = await sql<MemberRow[]>`
    select m.id, m.email, m.pseudo, m.lang, m.verified_at, m.banned, m.created_at
    from member_sessions s join members m on m.id = s.member_id
    where s.token_hash = ${sha256(token)} and s.expires_at > now() and not m.banned`;
  return row ? toMember(row) : null;
}

// --- E-mailed links ---------------------------------------------------------

export type TokenKind = "verify" | "reset";
const TOKEN_HOURS: Record<TokenKind, number> = { verify: 48, reset: 1 };

// Returns null when a link of this kind was sent less than a minute ago.
export async function createToken(memberId: number, kind: TokenKind): Promise<string | null> {
  const sql = await db();
  const [recent] = await sql`
    select 1 from member_tokens where member_id = ${memberId} and kind = ${kind} and created_at > now() - interval '1 minute'`;
  if (recent) return null;
  const token = newToken();
  await sql`delete from member_tokens where member_id = ${memberId} and kind = ${kind}`;
  await sql`
    insert into member_tokens (token_hash, member_id, kind, expires_at)
    values (${sha256(token)}, ${memberId}, ${kind}, ${new Date(Date.now() + TOKEN_HOURS[kind] * 3_600_000)})`;
  return token;
}

// Uses a link once: returns the member it was made for, if still valid.
export async function consumeToken(token: string, kind: TokenKind): Promise<number | null> {
  if (!token) return null;
  const sql = await db();
  const [row] = await sql<{ member_id: number }[]>`
    delete from member_tokens where token_hash = ${sha256(token)} and kind = ${kind} and expires_at > now() returning member_id`;
  return row?.member_id ?? null;
}

export async function markVerified(memberId: number) {
  const sql = await db();
  await sql`update members set verified_at = coalesce(verified_at, now()) where id = ${memberId}`;
}

export async function setPassword(memberId: number, password: string) {
  const sql = await db();
  await sql`update members set password_hash = ${await hashPassword(password)} where id = ${memberId}`;
  // A new password signs out every other device.
  await sql`delete from member_sessions where member_id = ${memberId}`;
}

export async function deleteMember(memberId: number) {
  const sql = await db();
  await sql`delete from members where id = ${memberId}`;
}

// --- Admin -----------------------------------------------------------------

export async function listMembers(): Promise<(Member & { comments: number })[]> {
  const sql = await db();
  const rows = await sql<(MemberRow & { comments: number })[]>`
    select m.id, m.email, m.pseudo, m.lang, m.verified_at, m.banned, m.created_at,
      (select count(*)::int from comments c where c.member_id = m.id) as comments
    from members m order by m.created_at desc limit 500`;
  return rows.map((r) => ({ ...toMember(r), comments: r.comments }));
}

export async function setBanned(memberId: number, banned: boolean) {
  const sql = await db();
  await sql`update members set banned = ${banned} where id = ${memberId}`;
  if (banned) await sql`delete from member_sessions where member_id = ${memberId}`;
}
