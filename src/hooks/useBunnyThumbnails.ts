"use client";

import { useSyncExternalStore } from "react";
import {
  getBunnyThumbnailCacheSnapshot,
  subscribeBunnyThumbnailCache,
} from "@/lib/bunny-thumbnail-cache";

export function useBunnyThumbnails(bunnyRefs: string[]) {
  const map = useSyncExternalStore(
    subscribeBunnyThumbnailCache,
    getBunnyThumbnailCacheSnapshot,
    (): Record<string, string> => ({}),
  );

  return map;
}