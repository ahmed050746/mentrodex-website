import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import {
  PORTAL_SESSION_COOKIE,
  PORTAL_SESSION_MAX_AGE_SEC,
  PORTAL_SESSION_VERSION,
} from "./constants";
import { isUuid } from "./validation";

function portalSessionSecret(): string | undefined {
  return process.env.PORTAL_SESSION_SECRET?.trim() || undefined;
}

function signStudentSession(
  studentId: string,
  iat: number,
  exp: number,
  secret: string,
): string {
  return createHmac("sha256", secret)
    .update(`${PORTAL_SESSION_VERSION}:${studentId}:${iat}:${exp}`)
    .digest("hex");
}

export type PortalSessionTokenParts = {
  studentId: string;
  iat: number;
  exp: number;
  signature: string;
};

export function parsePortalSessionToken(token: string): PortalSessionTokenParts | null {
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [studentId, iatStr, expStr, signature] = parts;
  if (!studentId || !iatStr || !expStr || !signature) return null;
  const iat = Number(iatStr);
  const exp = Number(expStr);
  if (!Number.isFinite(iat) || !Number.isFinite(exp)) return null;
  return { studentId, iat, exp, signature };
}

export function verifyPortalSessionToken(token: string): string | null {
  const secret = portalSessionSecret();
  if (!secret) return null;

  const parsed = parsePortalSessionToken(token);
  if (!parsed) return null;
  if (!isUuid(parsed.studentId)) return null;

  const now = Math.floor(Date.now() / 1000);
  if (parsed.exp < now) return null;
  if (parsed.iat > now + 60) return null;

  const expected = signStudentSession(
    parsed.studentId,
    parsed.iat,
    parsed.exp,
    secret,
  );
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
  const now = Math.floor(Date.now() / 1000);
  const iat = now;
  const exp = now + PORTAL_SESSION_MAX_AGE_SEC;
  const sig = signStudentSession(studentId, iat, exp, secret);
  return `${studentId}.${iat}.${exp}.${sig}`;
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

/** Prefer on Route Handler responses — ensures `Set-Cookie` is sent to the browser. */
export function attachPortalSessionCookie(
  response: NextResponse,
  studentId: string,
): boolean {
  const token = createPortalSessionToken(studentId);
  if (!token) return false;
  const opts = portalSessionCookieOptions(token);
  response.cookies.set(opts.name, opts.value, {
    httpOnly: opts.httpOnly,
    secure: opts.secure,
    sameSite: opts.sameSite,
    path: opts.path,
    maxAge: opts.maxAge,
  });
  return true;
}

export async function setPortalSessionCookie(studentId: string): Promise<boolean> {
  const token = createPortalSessionToken(studentId);
  if (!token) return false;
  const cookieStore = await cookies();
  const opts = portalSessionCookieOptions(token);
  cookieStore.set(opts.name, opts.value, {
    httpOnly: opts.httpOnly,
    secure: opts.secure,
    sameSite: opts.sameSite,
    path: opts.path,
    maxAge: opts.maxAge,
  });
  return true;
}

export function clearPortalSessionOnResponse(response: NextResponse): void {
  response.cookies.set(PORTAL_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
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