import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_ORDERS_COOKIE = "admin_orders_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

function adminPassword(): string | undefined {
  return process.env.ADMIN_ORDERS_PASSWORD?.trim() || undefined;
}

function signPayload(exp: number, secret: string): string {
  return createHmac("sha256", secret).update(`admin-orders-v1:${exp}`).digest("hex");
}

export function createAdminOrdersSessionToken(): string | null {
  const secret = adminPassword();
  if (!secret) return null;
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;
  return `${exp}.${signPayload(exp, secret)}`;
}

export function verifyAdminOrdersSessionToken(token: string): boolean {
  const secret = adminPassword();
  if (!secret) return false;
  const [expStr, sig] = token.split(".");
  if (!expStr || !sig) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  const expected = signPayload(exp, secret);
  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function verifyAdminOrdersPassword(password: string): boolean {
  const expected = adminPassword();
  if (!expected) return false;
  const a = createHmac("sha256", "admin-orders-pw-check").update(password).digest();
  const b = createHmac("sha256", "admin-orders-pw-check").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function isAdminOrdersAuthed(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_ORDERS_COOKIE)?.value;
  if (!token) return false;
  return verifyAdminOrdersSessionToken(token);
}

export function adminSessionCookieOptions(token: string) {
  return {
    name: ADMIN_ORDERS_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  };
}

export function isPurchaseEventName(name: string | null | undefined): boolean {
  return name?.trim().toLowerCase() === "purchase";
}