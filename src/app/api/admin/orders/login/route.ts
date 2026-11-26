import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_ORDERS_COOKIE,
  adminSessionCookieOptions,
  createAdminOrdersSessionToken,
  verifyAdminOrdersPassword,
} from "@/lib/adminOrdersSession";

export async function POST(request: Request) {
  if (!process.env.ADMIN_ORDERS_PASSWORD?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Admin login is not configured." },
      { status: 503 },
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