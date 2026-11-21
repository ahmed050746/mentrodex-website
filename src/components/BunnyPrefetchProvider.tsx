"use client";

import { useEffect, type ReactNode } from "react";
import { LECTURE_VIDEOS } from "@/content/lecture-videos";
import { TESTIMONIAL_VIDEOS } from "@/content/testimonial-videos";
import { prefetchBunnyThumbnails } from "@/lib/bunny-thumbnail-cache";

const ALL_BUNNY_REFS = [
  ...TESTIMONIAL_VIDEOS.map((v) => v.bunny),
  ...LECTURE_VIDEOS.map((l) => l.bunny),
];

export function BunnyPrefetchProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    prefetchBunnyThumbnails(ALL_BUNNY_REFS);
  }, []);

  return children;
}