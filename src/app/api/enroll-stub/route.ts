import { COURSE_CURRENCY, COURSE_PRICE_PKR } from "@/lib/coursePrice";
import { normalizePakPhone } from "@/lib/normalizePakPhone";
import { checkEnrollStubRateLimit, clientIpFromRequest } from "@/lib/rateLimit";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import {
  createServiceRoleClient,
  SupabaseConfigError,
} from "@/lib/supabase/serviceRole";
import { NextResponse } from "next/server";

const BUCKET = "payment-screenshots";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function extFromMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

/** Windows often sends an empty File.type; infer from extension. */
function resolveImageMime(file: File): string | null {
  if (file.type && ALLOWED_TYPES.has(file.type)) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  return null;
}

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { ok: false, error: "Supabase is not configured in .env.local" },
      { status: 503 },
    );
  }

  const ip = clientIpFromRequest(request);
  if (!checkEnrollStubRateLimit(ip)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Too many submissions. Try again in a minute.",
      },
      { status: 429 },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      {
        ok: false,
        error: "Expected multipart/form-data with a screenshot file.",
      },
      { status: 400 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not read form data." },
      { status: 400 },
    );
  }

  const first_name = String(form.get("fn") ?? "").trim();
  const last_name = String(form.get("ln") ?? "").trim();
  const phoneRaw = String(form.get("phone") ?? "").trim();
  const screenshot = form.get("screenshot");

  if (!first_name || !last_name || !phoneRaw) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields (name and phone)." },
      { status: 400 },
    );
  }

  const phone_number = normalizePakPhone(phoneRaw);
  if (!phone_number) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Invalid phone number. Use a Pakistan mobile (e.g. 0300 1234567).",
      },
      { status: 400 },
    );
  }

  if (!(screenshot instanceof File) || screenshot.size === 0) {
    return NextResponse.json(
      { ok: false, error: "Payment screenshot is required." },
      { status: 400 },
    );
  }

  if (screenshot.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Screenshot must be 5MB or smaller." },
      { status: 400 },
    );
  }

  const imageMime = resolveImageMime(screenshot);
  if (!imageMime) {
    return NextResponse.json(
      {
        ok: false,
        error: "Screenshot must be JPG, PNG, or WebP.",
      },
      { status: 400 },
    );
  }

  const country = String(form.get("country") ?? "").trim() || null;
  const city = String(form.get("city") ?? "").trim() || null;
  const currency = COURSE_CURRENCY;
  const value = COURSE_PRICE_PKR;
  const event_name =
    String(form.get("event_name") ?? "").trim() ||
    "payment_screenshot_submitted";
  const email = String(form.get("email") ?? "").trim() || null;
  const fbp = String(form.get("fbp") ?? "").trim() || null;
  const fbc = String(form.get("fbc") ?? "").trim() || null;
  const user_agent = String(form.get("user_agent") ?? "").trim() || null;

  const order_id = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const ext = extFromMime(imageMime);
  const objectPath = `${order_id}/${Date.now()}-${sanitizeFilename(screenshot.name || `payment.${ext}`)}`;

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch (e) {
    const message =
      e instanceof SupabaseConfigError
        ? e.message
        : "Server database client is not configured.";
    return NextResponse.json(
      {
        ok: false,
        error: message,
        hint: "Add SUPABASE_SERVICE_ROLE_KEY in Vercel / .env.local (server-only).",
      },
      { status: 503 },
    );
  }

  const fileBuffer = Buffer.from(await screenshot.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, fileBuffer, {
      contentType: imageMime,
      upsert: false,
    });

  if (uploadError) {
    console.error("[enroll-stub] Storage upload:", uploadError.message);
    return NextResponse.json(
      {
        ok: false,
        error: uploadError.message,
        hint:
          "Run supabase/migrations/005_storage_payment_screenshots.sql in SQL editor. Add SUPABASE_SERVICE_ROLE_KEY to .env.local if upload is denied.",
      },
      { status: 500 },
    );
  }

  const image_upload = objectPath;

  const { data, error } = await supabase
    .from("orders")
    .insert({
      order_id,
      city,
      country,
      currency,
      value,
      first_name,
      last_name,
      phone_number,
      event_name,
      image_upload,
      email,
      fbp,
      fbc,
      user_agent,
    })
    .select("id, order_id, image_upload")
    .single();

  if (error) {
    console.error("[enroll-stub] Supabase insert:", error.message);
    await supabase.storage.from(BUCKET).remove([objectPath]);
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        hint:
          "Add SUPABASE_SERVICE_ROLE_KEY on the server (Vercel env). Run supabase/migrations/013_revoke_anon_insert_orders.sql only after service role is configured.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    stored: true,
    id: data.id,
    order_id: data.order_id,
  });
}