"use client";

import { useLayoutEffect } from "react";

type HeaderStagePair = {
  header: HTMLElement;
  stage: HTMLElement;
};

/** Shows header Enroll + white bar after hero scrolls away (mobile + desktop). */
export function HomeHeaderScroll() {
  useLayoutEffect(() => {
    const pairs: HeaderStagePair[] = [];

    const desktopHeader = document.querySelector<HTMLElement>(
      "#layout-desktop .d-header--fallback",
    );
    const desktopStage = document.getElementById("desktop-hero-stage");
    if (desktopHeader && desktopStage) {
      pairs.push({ header: desktopHeader, stage: desktopStage });
    }

    const mobileHeader = document.querySelector<HTMLElement>(
      "#layout-mobile .m-header",
    );
    const mobileStage = document.querySelector<HTMLElement>(
      "#layout-mobile .m-stage",
    );
    if (mobileHeader && mobileStage) {
      pairs.push({ header: mobileHeader, stage: mobileStage });
    }

    if (!pairs.length) return;

    let raf = 0;
    const update = () => {
      for (const { header, stage } of pairs) {
        const bottom = stage.getBoundingClientRect().bottom;
        const pastHero = bottom <= header.offsetHeight * 0.5;
        header.classList.toggle("is-past-hero", pastHero);
        header.classList.toggle("is-scrolled", pastHero);
      }
    };

    const onScrollOrResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, []);

  return null;
}