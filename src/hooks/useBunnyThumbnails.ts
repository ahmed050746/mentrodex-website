"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  ensureBunnyThumbnail,
  getBunnyThumbnailCacheSnapshot,
  subscribeBunnyThumbnailCache,
} from "@/lib/bunny-thumbnail-cache";

export function useBunnyThumbnails(bunnyRefs: string[]) {
  const map = useSyncExternalStore(
    subscribeBunnyThumbnailCache,
    getBunnyThumbnailCacheSnapshot,
    (): Record<string, string> => ({}),
  );

  const unique = useMemo(
    () => [...new Set(bunnyRefs.filter(Boolean))],
    [bunnyRefs],
  );

  useEffect(() => {
    if (!unique.length) return;

    const load = () => {
      for (const ref of unique) {
        void ensureBunnyThumbnail(ref);
      }
    };

    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(load, { timeout: 4000 });
      return () => cancelIdleCallback(id);
    }

    const timer = setTimeout(load, 500);
    return () => clearTimeout(timer);
  }, [unique]);

  return map;
}