import { parseBunnyRef } from "@/lib/bunny-embed";

/**
 * Accept embed URL, bunny_ref, or an iframe HTML snippet; store as `{libraryId}/{videoId}`.
 */
export function extractBunnyRefForStorage(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let input = raw.trim();
  if (!input) return null;

  const iframeSrc = input.match(/<iframe[^>]+src=["']([^"']+)["']/i)?.[1];
  if (iframeSrc) {
    const src = iframeSrc.trim();
    if (/^\s*javascript:/i.test(src)) return null;
    input = src;
  }

  const parsed = parseBunnyRef(input);
  if (!parsed) return null;
  return `${parsed.libraryId}/${parsed.videoId}`;
}