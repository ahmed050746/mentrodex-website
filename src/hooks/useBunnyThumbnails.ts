"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchBunnyOEmbedThumbnail } from "@/lib/bunny-embed";

export function useBunnyThumbnails(bunnyRefs: string[]) {
  const keys = useMemo(
    () => [...new Set(bunnyRefs.filter(Boolean))].sort().join("\0"),
    [bunnyRefs],
  );
  const unique = useMemo(() => (keys ? keys.split("\0") : []), [keys]);

  const [byRef, setByRef] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!unique.length) return;
    let cancelled = false;

    void (async () => {
      const entries = await Promise.all(
        unique.map(async (ref) => {
          const url = await fetchBunnyOEmbedThumbnail(ref);
          return [ref, url] as const;
        }),
      );
      if (cancelled) return;
      const next: Record<string, string> = {};
      for (const [ref, url] of entries) {
        if (url) next[ref] = url;
      }
      setByRef(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [unique]);

  return byRef;
}