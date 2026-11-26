import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import {
  PORTAL_SESSION_COOKIE,
  PORTAL_SESSION_MAX_AGE_SEC,
  PORTAL_SESSION_VERSION,
} from "./constants";

function portalSessionSecret(): string | undefined {
  return process.env.PORTAL_SESSION_SECRET?.trim() || undefined;
}

function signStudentSession(studentId: string, exp: number, secret: string): string {
  return createHmac("sha256", secret)
    .update(`${PORTAL_SESSION_VERSION}:${studentId}:${exp}`)
    .digest("hex");
}

export type PortalSessionTokenParts = {
  studentId: string;
  exp: number;
  signature: string;
};

export function parsePortalSessionToken(token: string): PortalSessionTokenParts | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [studentId, expStr, signature] = parts;
  if (!studentId || !expStr || !signature) return null;
  const exp = Number(expStr);
  if (!Number.isFinite(exp)) return null;
  return { studentId, exp, signature };
}

export function verifyPortalSessionToken(token: string): string | null {
  const secret = portalSessionSecret();
  if (!secret) return null;

  const parsed = parsePortalSessionToken(token);
  if (!parsed) return null;

  const now = Math.floor(Date.now() / 1000);
  if (parsed.exp < now) return null;

  const expected = signStudentSession(parsed.studentId, parsed.exp, secret);
  try {
    const a = Buffer.from(parsed.signature, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  return parsed.studentId;
}

export function createPortalSessionToken(studentId: string): string | null {
  const secret = portalSessionSecret();
  if (!secret) return null;
  const exp = Math.floor(Date.now() / 1000) + PORTAL_SESSION_MAX_AGE_SEC;
  const sig = signStudentSession(studentId, exp, secret);
  return `${studentId}.${exp}.${sig}`;
}

export async function readPortalSessionTokenFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(PORTAL_SESSION_COOKIE)?.value;
}

export function portalSessionCookieOptions(token: string) {
  return {
    name: PORTAL_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: PORTAL_SESSION_MAX_AGE_SEC,
  };
}

export async function clearPortalSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PORTAL_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function isPortalSessionConfigured(): boolean {
  return Boolean(portalSessionSecret());
}