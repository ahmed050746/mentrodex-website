const MEDIADELIVERY_HOST_RE = /(^|\.)mediadelivery\.net$/i;

function isAllowedBunnyEmbedSource(trimmed: string): boolean {
  if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith("//")) {
    return true;
  }
  try {
    const url = new URL(trimmed.startsWith("//") ? `https:${trimmed}` : trimmed);
    if (!MEDIADELIVERY_HOST_RE.test(url.hostname)) return false;
    return /\/embed\/\d+\/[a-f0-9-]+/i.test(url.pathname);
  } catch {
    return false;
  }
}

/** Parse Bunny refs: `bunny:786982/uuid`, `786982/uuid`, or mediadelivery embed URL */
export function parseBunnyRef(
  input: string,
): { libraryId: string; videoId: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("//")) {
    if (!isAllowedBunnyEmbedSource(trimmed)) return null;
  }

  const embedMatch = trimmed.match(/embed\/(\d+)\/([a-f0-9-]+)/i);
  if (embedMatch) {
    return { libraryId: embedMatch[1], videoId: embedMatch[2] };
  }

  const bunnyPrefix = trimmed.match(/^bunny:(\d+)\/(.+)$/i);
  if (bunnyPrefix) {
    return { libraryId: bunnyPrefix[1], videoId: bunnyPrefix[2] };
  }

  const slash = trimmed.match(/^(\d+)\/([a-f0-9-]+)$/i);
  if (slash) {
    return { libraryId: slash[1], videoId: slash[2] };
  }

  return null;
}

/** Lazy-friendly embed URL — card previews can set `preload: true` for Bunny’s poster frame. */
export function bunnyEmbedUrl(
  input: string,
  {
    autoplay = false,
    preload = false,
    muted = false,
  }: { autoplay?: boolean; preload?: boolean; muted?: boolean } = {},
): string | null {
  const parsed = parseBunnyRef(input);
  if (!parsed) return null;

  const params = new URLSearchParams({
    autoplay: autoplay ? "true" : "false",
    loop: "false",
    muted: muted ? "true" : "false",
    preload: preload ? "true" : "false",
    responsive: "true",
  });

  return `https://player.mediadelivery.net/embed/${parsed.libraryId}/${parsed.videoId}?${params.toString()}`;
}

/**
 * Real poster from Bunny CDN (public oEmbed — no API key).
 * Prefer this over the old mediadelivery thumbnail host (invalid DNS).
 */
export async function fetchBunnyOEmbedThumbnail(
  input: string,
): Promise<string | null> {
  const embed = bunnyEmbedUrl(input, { autoplay: false, preload: false });
  if (!embed) return null;

  try {
    const res = await fetch(
      `https://video.bunnycdn.com/oembed?url=${encodeURIComponent(embed)}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { thumbnail_url?: string };
    return data.thumbnail_url?.trim() || null;
  } catch {
    return null;
  }
}
