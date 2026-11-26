import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { COURSE_CURRENCY, COURSE_PRICE_PKR } from "@/lib/coursePrice";
import { resolveMetaTestEventCode } from "@/lib/metaTracking";

const GRAPH_VERSION = "v21.0";

type OrderRow = {
  order_id?: string | null;
  event_name?: string | null;
  value?: number | string | null;
  currency?: string | null;
  email?: string | null;
  phone_number?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  city?: string | null;
  country?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  user_agent?: string | null;
};

type SupabaseWebhookBody = {
  record?: OrderRow | null;
  old_record?: OrderRow | null;
};

function isPurchaseEventName(name: string | null | undefined): boolean {
  return name?.trim().toLowerCase() === "purchase";
}

function hashPII(value: string): string {
  return createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex");
}

function hashPhoneDigits(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return createHash("sha256").update(digits).digest("hex");
}

function parseOrderValue(raw: OrderRow["value"]): number {
  if (raw == null || raw === "") return COURSE_PRICE_PKR;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : COURSE_PRICE_PKR;
}

function shouldSendPurchase(
  record: OrderRow | null | undefined,
  oldRecord: OrderRow | null | undefined,
): record is OrderRow {
  if (!record?.order_id?.trim()) return false;
  if (!isPurchaseEventName(record.event_name)) return false;
  if (oldRecord && isPurchaseEventName(oldRecord.event_name)) return false;
  return true;
}

function buildUserData(record: OrderRow): Record<string, string | string[]> {
  const userData: Record<string, string | string[]> = {};

  const ua = record.user_agent?.trim();
  if (ua) userData.client_user_agent = ua;

  const fbp = record.fbp?.trim();
  if (fbp) userData.fbp = fbp;

  const fbc = record.fbc?.trim();
  if (fbc) userData.fbc = fbc;

  const email = record.email?.trim();
  if (email) userData.em = [hashPII(email)];

  const phone = record.phone_number?.trim();
  if (phone) {
    const hashed = hashPhoneDigits(phone);
    if (hashed) userData.ph = [hashed];
  }

  const firstName = record.first_name?.trim();
  if (firstName) userData.fn = [hashPII(firstName)];

  const lastName = record.last_name?.trim();
  if (lastName) userData.ln = [hashPII(lastName)];

  const city = record.city?.trim();
  if (city) userData.ct = [hashPII(city)];

  const countryCode = (record.country?.trim() || "pk").toLowerCase();
  userData.country = [hashPII(countryCode.length === 2 ? countryCode : "pk")];

  return userData;
}

export async function POST(request: Request) {
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { ok: false, error: "WEBHOOK_SECRET is not configured." },
      { status: 503 },
    );
  }

  const headerSecret = request.headers.get("x-webhook-secret");
  if (!headerSecret || headerSecret !== webhookSecret) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !accessToken) {
    return NextResponse.json(
      { ok: false, error: "Meta CAPI is not configured on the server." },
      { status: 503 },
    );
  }

  let body: SupabaseWebhookBody;
  try {
    body = (await request.json()) as SupabaseWebhookBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const { record, old_record: oldRecord } = body;

  if (!shouldSendPurchase(record, oldRecord)) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Not a new transition to Purchase.",
    });
  }

  const orderId = record.order_id!.trim();
  const currency = record.currency?.trim() || COURSE_CURRENCY;
  const value = parseOrderValue(record.value);

  const eventPayload = {
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    event_id: orderId,
    action_source: "website",
    user_data: buildUserData(record),
    custom_data: {
      value,
      currency,
    },
  };

  const graphBody: Record<string, unknown> = {
    data: [eventPayload],
  };
  const testEventCode = resolveMetaTestEventCode();
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
      console.error("[meta-purchase]", json.error?.message ?? res.statusText);
      return NextResponse.json(
        { ok: false, error: json.error?.message ?? "Meta API request failed." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      events_received: json.events_received ?? 1,
      order_id: orderId,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[meta-purchase]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}