import type { Metadata } from "next";
import { HomeHeaderScroll } from "@/components/home/HomeHeaderScroll";
import HomeLegacyMarkup from "@/components/home/HomeLegacyMarkup";
import { LegacyStyles } from "@/components/LegacyStyles";
import { HomeCourseJsonLd } from "@/components/seo/HomeCourseJsonLd";
import { OWNER_NAME, SITE_NAME, SITE_URL } from "@/lib/site-seo";

export const metadata: Metadata = {
  title: "E-Commerce Mentorship Pakistan | Shopify & Dropshipping Expert",
  description: `Get 1-on-1 mentorship from ${OWNER_NAME}, founder of ${SITE_NAME}. Master Shopify, dropshipping, eBay, Walmart, and Etsy with 16+ years of industry experience. Enroll now for Rs. 4,500.`,
  openGraph: {
    title: `E-Commerce Mentorship with ${OWNER_NAME} | ${SITE_NAME}`,
    description:
      "Shopify and dropshipping mentorship in Pakistan — 1-on-1 guidance from an experienced e-commerce mentor.",
    url: SITE_URL,
  },
  alternates: { canonical: SITE_URL },
};

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