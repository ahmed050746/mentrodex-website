"use client";

import { useEffect, useState, type ReactNode } from "react";

type LayoutVariant = "mobile" | "desktop";

const LAYOUT_MQ = "(min-width: 900px)";

function layoutMatchesViewport(layout: LayoutVariant): boolean {
  return window.matchMedia(LAYOUT_MQ).matches
    ? layout === "desktop"
    : layout === "mobile";
}

/**
 * Mounts client UI only for the active layout after hydration (avoids SSR/client mismatch).
 */
export function LayoutGatedClient({
  layout,
  children,
}: {
  layout: LayoutVariant;
  children: ReactNode;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(LAYOUT_MQ);
    const sync = () => setShow(layoutMatchesViewport(layout));
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [layout]);

  if (!show) return null;
  return children;
}