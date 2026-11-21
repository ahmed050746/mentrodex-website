/** Parse Bunny refs: `bunny:786982/uuid`, `786982/uuid`, or mediadelivery embed URL */
export function parseBunnyRef(
  input: string,
): { libraryId: string; videoId: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

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

/** Lazy-friendly embed URL — no stream until iframe is mounted (use `preload=false`). */
export function bunnyEmbedUrl(
  input: string,
  { autoplay = false }: { autoplay?: boolean } = {},
): string | null {
  const parsed = parseBunnyRef(input);
  if (!parsed) return null;

  const params = new URLSearchParams({
    autoplay: autoplay ? "true" : "false",
    loop: "false",
    muted: "false",
    preload: "false",
    responsive: "true",
  });

  return `https://player.mediadelivery.net/embed/${parsed.libraryId}/${parsed.videoId}?${params.toString()}`;
}

/** Lightweight preview image (main player poster only — not used in the list). */
export function bunnyPosterUrl(input: string): string | null {
  const parsed = parseBunnyRef(input);
  if (!parsed) return null;
  return `https://thumbnail.mediadelivery.net/${parsed.libraryId}/${parsed.videoId}/thumbnail.jpg`;
}