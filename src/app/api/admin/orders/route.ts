import { NextResponse } from "next/server";
import {
  isAdminOrdersAuthed,
  isPurchaseEventName,
} from "@/lib/adminOrdersSession";
import { formatCreatedAtPkt } from "@/lib/formatPktTime";
import type { AdminOrderRow } from "@/lib/adminOrdersTypes";
import { withSignedPaymentScreenshotUrls } from "@/lib/paymentScreenshots";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

const ORDER_COLUMNS =
  "id, order_id, created_at, first_name, last_name, email, phone_number, city, country, value, currency, event_name, image_upload";

function mapOrder(row: Record<string, unknown>): AdminOrderRow {
  const created_at = String(row.created_at ?? "");
  const valueRaw = row.value;
  const value =
    typeof valueRaw === "number"
      ? valueRaw
      : Number(valueRaw) || 0;
  return {
    id: String(row.id),
    order_id: String(row.order_id ?? ""),
    created_at,
    created_at_pkt: formatCreatedAtPkt(created_at),
    first_name: String(row.first_name ?? ""),
    last_name: String(row.last_name ?? ""),
    email: row.email != null ? String(row.email) : null,
    phone_number: row.phone_number != null ? String(row.phone_number) : null,
    city: row.city != null ? String(row.city) : null,
    country: row.country != null ? String(row.country) : null,
    value,
    currency: String(row.currency ?? "PKR"),
    event_name: String(row.event_name ?? ""),
    image_upload: row.image_upload != null ? String(row.image_upload) : null,
  };
}

export async function GET() {
  if (!(await isAdminOrdersAuthed())) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("orders")
      .select(ORDER_COLUMNS)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[admin/orders]", error.message);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    const mapped = (data ?? []).map((row) =>
      mapOrder(row as Record<string, unknown>),
    );
    const orders = await withSignedPaymentScreenshotUrls(supabase, mapped);
    return NextResponse.json({ ok: true, orders });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminOrdersAuthed())) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  let body: { order_id?: string };
  try {
    body = (await request.json()) as { order_id?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const orderId = body.order_id?.trim();
  if (!orderId) {
    return NextResponse.json(
      { ok: false, error: "order_id is required." },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceRoleClient();

    const { data: existing, error: fetchError } = await supabase
      .from("orders")
      .select("order_id, event_name")
      .eq("order_id", orderId)
      .maybeSingle();

    if (fetchError) {
      console.error("[admin/orders]", fetchError.message);
      return NextResponse.json(
        { ok: false, error: fetchError.message },
        { status: 500 },
      );
    }

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Order not found." },
        { status: 404 },
      );
    }

    if (isPurchaseEventName(existing.event_name)) {
      return NextResponse.json({
        ok: true,
        already_approved: true,
        order: { order_id: orderId, event_name: "Purchase" },
      });
    }

    const { data: updated, error: updateError } = await supabase
      .from("orders")
      .update({ event_name: "Purchase" })
      .eq("order_id", orderId)
      .select(ORDER_COLUMNS)
      .single();

    if (updateError) {
      console.error("[admin/orders]", updateError.message);
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 500 },
      );
    }

    const [order] = await withSignedPaymentScreenshotUrls(supabase, [
      mapOrder(updated as Record<string, unknown>),
    ]);
    return NextResponse.json({
      ok: true,
      order,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}