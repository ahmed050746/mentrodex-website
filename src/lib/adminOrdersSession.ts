import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_ORDERS_COOKIE = "admin_orders_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;
const SESSION_VERSION_LEGACY = "admin-orders-v1";
const SESSION_VERSION_CURRENT = "admin-orders-v2";

function adminPassword(): string | undefined {
  return process.env.ADMIN_ORDERS_PASSWORD?.trim() || undefined;
}

function adminSessionSecret(): string | undefined {
  return process.env.ADMIN_SESSION_SECRET?.trim() || undefined;
}

/** Login is allowed when password is set and session signing is configured for this environment. */
export function isAdminLoginConfigured(): boolean {
  if (!adminPassword()) return false;
  if (adminSessionSecret()) return true;
  return process.env.NODE_ENV !== "production";
}

function signPayload(exp: number, secret: string, version: string): string {
  return createHmac("sha256", secret)
    .update(`${version}:${exp}`)
    .digest("hex");
}

function verifyToken(token: string, secret: string, version: string): boolean {
  const [expStr, sig] = token.split(".");
  if (!expStr || !sig) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  const expected = signPayload(exp, secret, version);
  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function createAdminOrdersSessionToken(): string | null {
  const dedicated = adminSessionSecret();
  const secret = dedicated ?? adminPassword();
  if (!secret) return null;
  const version = dedicated ? SESSION_VERSION_CURRENT : SESSION_VERSION_LEGACY;
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;
  return `${exp}.${signPayload(exp, secret, version)}`;
}

export function verifyAdminOrdersSessionToken(token: string): boolean {
  const dedicated = adminSessionSecret();
  if (dedicated && verifyToken(token, dedicated, SESSION_VERSION_CURRENT)) {
    return true;
  }

  const password = adminPassword();
  if (password && verifyToken(token, password, SESSION_VERSION_LEGACY)) {
    return true;
  }

  return false;
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

export function isRejectedEventName(name: string | null | undefined): boolean {
  return name?.trim().toLowerCase() === "rejected";
}

/** Orders awaiting admin approve/reject (excludes Purchase and Rejected). */
export function isPendingOrderEventName(name: string | null | undefined): boolean {
  return !isPurchaseEventName(name) && !isRejectedEventName(name);
}