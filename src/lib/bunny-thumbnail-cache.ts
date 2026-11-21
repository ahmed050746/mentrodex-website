import { fetchBunnyOEmbedThumbnail } from "@/lib/bunny-embed";

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string | null>>();
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function getBunnyThumbnailCached(ref: string): string | undefined {
  return cache.get(ref);
}

export async function ensureBunnyThumbnail(ref: string): Promise<string | null> {
  const hit = cache.get(ref);
  if (hit) return hit;

  const pending = inflight.get(ref);
  if (pending) return pending;

  const promise = fetchBunnyOEmbedThumbnail(ref).then((url) => {
    inflight.delete(ref);
    if (url) {
      cache.set(ref, url);
      notify();
    }
    return url;
  });

  inflight.set(ref, promise);
  return promise;
}

export function prefetchBunnyThumbnails(refs: string[]): void {
  const unique = [...new Set(refs.filter(Boolean))];
  if (!unique.length) return;

  const run = () => {
    for (const ref of unique) {
      void ensureBunnyThumbnail(ref);
    }
  };

  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    requestIdleCallback(run, { timeout: 5000 });
  } else {
    setTimeout(run, 600);
  }
}

export function subscribeBunnyThumbnailCache(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const EMPTY_SNAPSHOT: Record<string, string> = {};
let snapshotCache: Record<string, string> = EMPTY_SNAPSHOT;
let snapshotSig = "";

export function getBunnyThumbnailCacheSnapshot(): Record<string, string> {
  if (cache.size === 0) {
    snapshotCache = EMPTY_SNAPSHOT;
    snapshotSig = "";
    return EMPTY_SNAPSHOT;
  }

  const sig = [...cache.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}\0${v}`)
    .join("\n");

  if (sig !== snapshotSig) {
    snapshotSig = sig;
    snapshotCache = Object.fromEntries(cache);
  }

  return snapshotCache;
}