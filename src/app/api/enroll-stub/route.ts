import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { NextResponse } from "next/server";

const BUCKET = "payment-screenshots";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const DEFAULT_CURRENCY = "PKR";

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
  const phone_number = String(form.get("phone") ?? "").trim();
  const screenshot = form.get("screenshot");

  if (!first_name || !last_name || !phone_number) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields (name and phone)." },
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

  const country_value = String(form.get("phoneCountry") ?? "").trim() || null;
  const city = String(form.get("city") ?? "").trim() || null;
  const currency = String(form.get("currency") ?? "").trim() || DEFAULT_CURRENCY;
  const event_name =
    String(form.get("event_name") ?? "").trim() ||
    "payment_screenshot_submitted";

  const order_id = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const ext = extFromMime(imageMime);
  const objectPath = `${order_id}/${Date.now()}-${sanitizeFilename(screenshot.name || `payment.${ext}`)}`;

  const supabase = createAdminClient();
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

  const { data: publicData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(objectPath);

  const image_upload = publicData.publicUrl;

  const { data, error } = await supabase
    .from("orders")
    .insert({
      order_id,
      city,
      country_value,
      currency,
      first_name,
      last_name,
      phone_number,
      event_name,
      image_upload,
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
          "Supabase → SQL Editor: open and run supabase/FIX_ORDERS_PERMISSIONS.sql (GRANT + RLS on orders).",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    stored: true,
    id: data.id,
    order_id: data.order_id,
    image_upload: data.image_upload,
  });
}