import { isAdminOrdersAuthed } from "@/lib/adminOrdersSession";
import {
  PAYMENT_SCREENSHOTS_BUCKET,
  parsePaymentScreenshotObjectPath,
} from "@/lib/paymentScreenshots";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

function contentTypeForPath(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

export async function GET(request: Request) {
  if (!(await isAdminOrdersAuthed())) {
    return new Response("Unauthorized.", { status: 401 });
  }

  const orderId = new URL(request.url).searchParams.get("order_id")?.trim();
  if (!orderId) {
    return new Response("order_id is required.", { status: 400 });
  }

  try {
    const supabase = createServiceRoleClient();
    const { data: row, error } = await supabase
      .from("orders")
      .select("image_upload")
      .eq("order_id", orderId)
      .maybeSingle();

    if (error) {
      console.error("[admin/orders/screenshot]", error.message);
      return new Response("Could not load order.", { status: 500 });
    }

    const storagePath = parsePaymentScreenshotObjectPath(row?.image_upload);
    if (!storagePath) {
      return new Response("No screenshot for this order.", { status: 404 });
    }

    const { data: file, error: downloadError } = await supabase.storage
      .from(PAYMENT_SCREENSHOTS_BUCKET)
      .download(storagePath);

    if (downloadError || !file) {
      console.error("[admin/orders/screenshot]", downloadError?.message);
      return new Response("Screenshot not found in storage.", { status: 404 });
    }

    const bytes = await file.arrayBuffer();
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": file.type || contentTypeForPath(storagePath),
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[admin/orders/screenshot]", message);
    return new Response(message, { status: 503 });
  }
}