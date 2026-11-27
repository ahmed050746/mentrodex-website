import { NextResponse } from "next/server";
import {
  PORTAL_LOGIN_FAIL_MSG,
  resolvePortalHomeRedirect,
} from "@/lib/portal/courseSnapshot";
import { fetchStudentAuthRow } from "@/lib/portal/db";
import {
  portalJsonError,
  portalJsonFromCaught,
} from "@/lib/portal/errors";
import { verifyPortalPassword } from "@/lib/portal/password";
import {
  checkPortalLoginRateLimit,
  clientIpFromRequest,
} from "@/lib/portal/rateLimit";
import {
  attachPortalSessionCookie,
  isPortalSessionConfigured,
} from "@/lib/portal/session";
import {
  parseLoginIdentifier,
  validatePasswordInput,
} from "@/lib/portal/validation";

export async function POST(request: Request) {
  try {
    if (!isPortalSessionConfigured()) {
      return portalJsonError("Portal login is not configured.", 503);
    }

    let body: { identifier?: unknown; password?: unknown };
    try {
      body = (await request.json()) as {
        identifier?: unknown;
        password?: unknown;
      };
    } catch {
      return portalJsonError(PORTAL_LOGIN_FAIL_MSG, 401);
    }

    const identifierRaw =
      typeof body.identifier === "string" ? body.identifier.trim() : "";
    const password = validatePasswordInput(body.password);

    if (!identifierRaw || !password) {
      return portalJsonError(PORTAL_LOGIN_FAIL_MSG, 401);
    }

    const parsed = parseLoginIdentifier(identifierRaw);
    if (!parsed) {
      return portalJsonError(PORTAL_LOGIN_FAIL_MSG, 401);
    }

    const ip = clientIpFromRequest(request);
    const idKey =
      parsed.kind === "email"
        ? `email:${parsed.email}`
        : `phone:${parsed.phone_e164}`;

    if (
      !checkPortalLoginRateLimit(`ip:${ip}`) ||
      !checkPortalLoginRateLimit(idKey)
    ) {
      return portalJsonError(
        "Too many login attempts. Try again in a minute.",
        429,
      );
    }

    const authRow = await fetchStudentAuthRow(
      parsed.kind === "email"
        ? { kind: "email", email: parsed.email }
        : { kind: "phone", phone_e164: parsed.phone_e164 },
    );

    if (!authRow || !authRow.is_active) {
      return portalJsonError(PORTAL_LOGIN_FAIL_MSG, 401);
    }

    const valid = await verifyPortalPassword(password, authRow.password_hash);
    if (!valid) {
      return portalJsonError(PORTAL_LOGIN_FAIL_MSG, 401);
    }

    let redirectTo: string;
    try {
      redirectTo = await resolvePortalHomeRedirect(authRow.id);
    } catch (e) {
      console.error("[portal/login] resolvePortalHomeRedirect", e);
      redirectTo = "/portal";
    }

    if (!redirectTo.startsWith("/")) {
      redirectTo = "/portal";
    }

    const response = NextResponse.json({ ok: true as const, redirectTo });
    if (!attachPortalSessionCookie(response, authRow.id)) {
      return portalJsonError("Could not create session.", 500);
    }
    return response;
  } catch (err) {
    return portalJsonFromCaught(err, "Sign in failed.");
  }
}