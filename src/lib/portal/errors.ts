import { NextResponse } from "next/server";

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