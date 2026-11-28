import type { Metadata } from "next";
import { HomeHeaderScroll } from "@/components/home/HomeHeaderScroll";
import HomeLegacyMarkup from "@/components/home/HomeLegacyMarkup";
import { LegacyStyles } from "@/components/LegacyStyles";
import { HomeCourseJsonLd } from "@/components/seo/HomeCourseJsonLd";
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  buildPublicMetadata,
} from "@/lib/site-seo";

export const metadata: Metadata = buildPublicMetadata({
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  pathname: "/",
});

export default function HomePage() {
  return (
    <>
      <link
        rel="preload"
        as="image"
        href="/img/hero-mentor.webp?v=20261119perfB"
        type="image/webp"
        media="(max-width: 899px)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href="/img/hero-mentor-desktop.webp"
        type="image/webp"
        media="(min-width: 900px)"
      />
      <link rel="preload" as="style" href="/styles/design-tokens.css" />
      <link
        rel="preload"
        as="style"
        href="/styles/mobile-critical.css"
        media="(max-width: 899px)"
      />
      <link rel="preconnect" href="https://player.mediadelivery.net" />
      <link rel="dns-prefetch" href="https://video.bunnycdn.com" />
      <link rel="dns-prefetch" href="https://vz-40eaeb89-41e.b-cdn.net" />
      <LegacyStyles page="home" />
      <HomeCourseJsonLd />
      <HomeHeaderScroll />
      <HomeLegacyMarkup />
    </>
  );
}