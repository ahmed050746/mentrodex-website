import type { SupabaseClient } from "@supabase/supabase-js";

export const PAYMENT_SCREENSHOTS_BUCKET = "payment-screenshots";

/** How long admin UI can use screenshot URLs before refetching. */
const SIGNED_URL_TTL_SEC = 60 * 60 * 4;

const PUBLIC_PATH = `/object/public/${PAYMENT_SCREENSHOTS_BUCKET}/`;
const SIGN_PATH = `/object/sign/${PAYMENT_SCREENSHOTS_BUCKET}/`;

export function adminOrderScreenshotSrc(orderId: string): string {
  return `/api/admin/orders/screenshot?order_id=${encodeURIComponent(orderId)}`;
}

/** `image_upload` holds object path; legacy rows may store a full public URL. */
export function parsePaymentScreenshotObjectPath(
  stored: string | null | undefined,
): string | null {
  if (!stored?.trim()) return null;
  const value = stored.trim();
  if (!value.startsWith("http://") && !value.startsWith("https://")) {
    return value.replace(/^\/+/, "");
  }
  try {
    const pathname = new URL(value).pathname;
    for (const marker of [PUBLIC_PATH, SIGN_PATH]) {
      const idx = pathname.indexOf(marker);
      if (idx >= 0) {
        return decodeURIComponent(pathname.slice(idx + marker.length));
      }
    }
    const loose = /\/payment-screenshots\/(.+)$/i.exec(pathname);
    if (loose?.[1]) {
      return decodeURIComponent(loose[1]);
    }
  } catch {
    /* fall through */
  }

  if (value.includes(`${PAYMENT_SCREENSHOTS_BUCKET}/`)) {
    const after = value.split(`${PAYMENT_SCREENSHOTS_BUCKET}/`)[1];
    if (after) return decodeURIComponent(after.split("?")[0] ?? after);
  }

  return null;
}

function pickSignedUrl(
  item: {
    signedUrl?: string | null;
    signedURL?: string | null;
  },
  supabaseOrigin: string,
): string | null {
  const full = item.signedUrl?.trim();
  if (full?.startsWith("http://") || full?.startsWith("https://")) {
    return full;
  }
  const rel = (item.signedURL ?? item.signedUrl)?.trim();
  if (!rel) return null;
  if (rel.startsWith("http://") || rel.startsWith("https://")) return rel;
  const base = supabaseOrigin.replace(/\/$/, "");
  const path = rel.startsWith("/") ? rel : `/${rel}`;
  return `${base}/storage/v1${path}`;
}

export async function signedPaymentScreenshotUrl(
  supabase: SupabaseClient,
  stored: string | null | undefined,
): Promise<string | null> {
  const path = parsePaymentScreenshotObjectPath(stored);
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from(PAYMENT_SCREENSHOTS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SEC);

  if (error || !data?.signedUrl) {
    console.error("[payment-screenshots] sign:", error?.message);
    return null;
  }
  return data.signedUrl;
}

export async function withSignedPaymentScreenshotUrls<T extends { image_upload: string | null }>(
  supabase: SupabaseClient,
  rows: T[],
): Promise<T[]> {
  const entries = rows.map((row) => ({
    row,
    path: parsePaymentScreenshotObjectPath(row.image_upload),
  }));
  const paths = [
    ...new Set(
      entries.map((e) => e.path).filter((p): p is string => Boolean(p)),
    ),
  ];
  if (paths.length === 0) return rows;

  const { data, error } = await supabase.storage
    .from(PAYMENT_SCREENSHOTS_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SEC);

  if (error || !data) {
    console.error("[payment-screenshots] sign batch:", error?.message);
    return rows;
  }

  const supabaseOrigin = new URL(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://localhost",
  ).origin;

  const urlByPath = new Map<string, string>();
  for (const item of data) {
    if (!item.path || item.error) continue;
    const url = pickSignedUrl(item, supabaseOrigin);
    if (url) urlByPath.set(item.path, url);
  }

  const out = await Promise.all(
    entries.map(async ({ row, path }) => {
      if (!path) return row;
      let signed: string | null | undefined = urlByPath.get(path);
      if (!signed) {
        signed = await signedPaymentScreenshotUrl(supabase, path);
      }
      if (!signed) {
        return { ...row, image_upload: null };
      }
      return { ...row, image_upload: signed };
    }),
  );
  return out;
}