import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { resolveMetaTestEventCode } from "@/lib/metaTracking";

const GRAPH_VERSION = "v21.0";

type IncomingBody = {
  event_name?: string;
  event_id?: string;
  event_source_url?: string;
  user_data?: {
    email?: string | null;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  };
  custom_data?: Record<string, unknown>;
  test_event_code?: string;
};

function hashPII(value: string): string {
  return createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex");
}

function hashPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return createHash("sha256").update(digits).digest("hex");
}

function parseCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function clientIp(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim();
  }
  return request.headers.get("x-real-ip") ?? undefined;
}

export async function POST(request: Request) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    return NextResponse.json(
      { ok: false, error: "Meta CAPI is not configured on the server." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as IncomingBody;
  const eventName = body.event_name?.trim();
  const eventId = body.event_id?.trim();

  if (!eventName || !eventId) {
    return NextResponse.json(
      { ok: false, error: "event_name and event_id are required." },
      { status: 400 },
    );
  }

  const cookieHeader = request.headers.get("cookie");
  const userAgent = request.headers.get("user-agent") ?? undefined;
  const ip = clientIp(request);

  const userData: Record<string, string | string[]> = {};
  if (userAgent) userData.client_user_agent = userAgent;
  if (ip) userData.client_ip_address = ip;

  const fbp = parseCookie(cookieHeader, "_fbp");
  const fbc = parseCookie(cookieHeader, "_fbc");
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  const email = body.user_data?.email?.trim();
  if (email) {
    userData.em = [hashPII(email)];
  }

  const phone = body.user_data?.phone?.trim();
  if (phone) {
    const hashed = hashPhone(phone);
    if (hashed) userData.ph = [hashed];
  }

  const firstName = body.user_data?.firstName?.trim();
  if (firstName) {
    userData.fn = [hashPII(firstName)];
  }

  const lastName = body.user_data?.lastName?.trim();
  if (lastName) {
    userData.ln = [hashPII(lastName)];
  }

  const eventPayload: Record<string, unknown> = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: "website",
    user_data: userData,
  };

  if (body.event_source_url) {
    eventPayload.event_source_url = body.event_source_url;
  }
  if (body.custom_data && Object.keys(body.custom_data).length > 0) {
    eventPayload.custom_data = body.custom_data;
  }

  const graphBody: Record<string, unknown> = {
    data: [eventPayload],
  };
  const testEventCode = resolveMetaTestEventCode(body.test_event_code);
  if (testEventCode) {
    graphBody.test_event_code = testEventCode;
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(graphBody),
    });

    const json = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
      events_received?: number;
    };

    if (!res.ok) {
      console.error("[meta/capi]", json.error?.message ?? res.statusText);
      return NextResponse.json(
        { ok: false, error: json.error?.message ?? "Meta API request failed." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      events_received: json.events_received ?? 1,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[meta/capi]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}