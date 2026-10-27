import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// One shared password (ADMIN_PASSWORD) protects the admin page. The cookie
// holds a value derived from it, so changing the password signs everyone out.
const COOKIE = "mf_admin";

const password = () => process.env.ADMIN_PASSWORD?.trim() ?? "";
export const hasAdminPassword = () => password().length > 0;

const token = () => createHmac("sha256", password()).update("maroc-foot-admin").digest("hex");

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function isAdmin() {
  if (!hasAdminPassword()) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  return value !== undefined && same(value, token());
}

export async function signIn(candidate: string) {
  if (!hasAdminPassword() || !same(candidate.trim(), password())) return false;
  (await cookies()).set(COOKIE, token(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return true;
}

export async function signOut() {
  (await cookies()).delete(COOKIE);
}
