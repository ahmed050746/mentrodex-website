import type { Metadata } from "next";
import { HomeHeaderScroll } from "@/components/home/HomeHeaderScroll";
import HomeLegacyMarkup from "@/components/home/HomeLegacyMarkup";
import { LegacyStyles } from "@/components/LegacyStyles";
export const metadata: Metadata = {
  title: "E-Commerce Mentorship Pakistan | Shopify & Dropshipping Expert",
  description:
    "Get 1-on-1 mentorship from an experienced e-commerce mentor in Pakistan. Master Shopify, dropshipping, eBay, Walmart, and Etsy with 16+ years of industry experience. Enroll now for just Rs. 4,500.",
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
      <LegacyStyles page="home" />
      <HomeHeaderScroll />
      <HomeLegacyMarkup />
    </>
  );
}