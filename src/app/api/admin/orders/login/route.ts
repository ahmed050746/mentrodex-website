import {
  checkAdminOrdersLoginRateLimit,
  clientIpFromRequest,
} from "@/lib/rateLimit";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_ORDERS_COOKIE,
  adminSessionCookieOptions,
  createAdminOrdersSessionToken,
  isAdminLoginConfigured,
  verifyAdminOrdersPassword,
} from "@/lib/adminOrdersSession";

export async function POST(request: Request) {
  if (!isAdminLoginConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: "Admin login is not configured.",
        hint:
          process.env.NODE_ENV === "production"
            ? "Set ADMIN_ORDERS_PASSWORD and ADMIN_SESSION_SECRET in Vercel."
            : "Set ADMIN_ORDERS_PASSWORD in .env.local (ADMIN_SESSION_SECRET recommended).",
      },
      { status: 503 },
    );
  }

  const ip = clientIpFromRequest(request);
  if (!checkAdminOrdersLoginRateLimit(ip)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Too many login attempts. Try again in a minute.",
      },
      { status: 429 },
    );
  }

  let body: { password?: string };
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const password = body.password ?? "";
  if (!verifyAdminOrdersPassword(password)) {
    return NextResponse.json({ ok: false, error: "Invalid password." }, { status: 401 });
  }

  const token = createAdminOrdersSessionToken();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Could not create session." },
      { status: 500 },
    );
  }

  const cookieStore = await cookies();
  const opts = adminSessionCookieOptions(token);
  cookieStore.set(opts.name, opts.value, {
    httpOnly: opts.httpOnly,
    secure: opts.secure,
    sameSite: opts.sameSite,
    path: opts.path,
    maxAge: opts.maxAge,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_ORDERS_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return NextResponse.json({ ok: true });
}