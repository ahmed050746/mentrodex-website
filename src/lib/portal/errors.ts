import { NextResponse } from "next/server";
import { SupabaseConfigError } from "@/lib/supabase/serviceRole";

export function portalJsonFromCaught(
  err: unknown,
  fallback: string,
): NextResponse {
  if (err instanceof SupabaseConfigError) {
    return portalJsonError(`${err.message}. Restart npm run dev after saving.`, 503);
  }
  if (err instanceof Error && err.message.toLowerCase().includes("missing")) {
    return portalJsonError(`${err.message}. Restart npm run dev after saving.`, 503);
  }
  return portalJsonError(fallback, 500);
}

export function portalJsonError(
  message: string,
  status: number,
  extra?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export function portalJsonOk<T extends Record<string, unknown>>(
  body: T,
  status = 200,
): NextResponse {
  return NextResponse.json({ ok: true, ...body }, { status });
}