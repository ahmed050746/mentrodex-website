"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";

const DESKTOP_MQ = "(min-width: 900px)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(DESKTOP_MQ);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getDesktopSnapshot() {
  return window.matchMedia(DESKTOP_MQ).matches;
}

/** SSR: no `<img>` in HTML — avoids ~650KB hero download on mobile. Desktop paints after mount. */
function getServerSnapshot() {
  return false;
}

/**
 * Desktop-only LCP hero. Pair with `<link rel="preload" … media="(min-width: 900px)" />` on the home page.
 */
export function DesktopHeroFallbackPhoto() {
  const isDesktop = useSyncExternalStore(
    subscribe,
    getDesktopSnapshot,
    getServerSnapshot,
  );

  if (!isDesktop) {
    return null;
  }

  return (
    <Image
      src="/img/hero-mentor-desktop.webp"
      alt="MD Ahmed Ali"
      width={480}
      height={640}
      priority
      sizes="(min-width: 900px) 58vw, 0px"
      className="d-hero-fallback__photo"
    />
  );
}