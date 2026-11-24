"use client";

import { useSyncExternalStore, type ReactNode } from "react";

type LayoutVariant = "mobile" | "desktop";

const LAYOUT_MQ = "(min-width: 900px)";

function layoutMatchesViewport(layout: LayoutVariant): boolean {
  return window.matchMedia(LAYOUT_MQ).matches
    ? layout === "desktop"
    : layout === "mobile";
}

function subscribe(onStoreChange: () => void) {
  const mq = window.matchMedia(LAYOUT_MQ);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getClientSnapshot(layout: LayoutVariant) {
  return layoutMatchesViewport(layout);
}

/** Mobile islands SSR in #layout-mobile (hidden on desktop via CSS). Desktop waits for viewport. */
function getServerSnapshot(layout: LayoutVariant) {
  return layout === "mobile";
}

/**
 * Mounts client UI for the active layout. Mobile content is included in SSR for stable CLS.
 */
export function LayoutGatedClient({
  layout,
  children,
  reserveMinHeight,
}: {
  layout: LayoutVariant;
  children: ReactNode;
  /** Reserved space when desktop islands are not yet mounted (SSR / narrow viewport). */
  reserveMinHeight?: number;
}) {
  const show = useSyncExternalStore(
    subscribe,
    () => getClientSnapshot(layout),
    () => getServerSnapshot(layout),
  );

  if (show) {
    return children;
  }

  if (layout === "desktop" && reserveMinHeight != null && reserveMinHeight > 0) {
    return (
      <div
        className="layout-gate-shell"
        aria-hidden="true"
        style={{ minHeight: reserveMinHeight }}
      />
    );
  }

  return null;
}