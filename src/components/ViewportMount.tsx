"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Placeholder min-height to avoid layout shift */
  minHeight?: number;
  rootMargin?: string;
};

/** Mount children when near viewport — saves JS and network on initial mobile load. */
export function ViewportMount({
  children,
  minHeight = 420,
  rootMargin = "240px 0px",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!("IntersectionObserver" in window)) {
      setShow(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} style={!show ? { minHeight } : undefined}>
      {show ? children : null}
    </div>
  );
}