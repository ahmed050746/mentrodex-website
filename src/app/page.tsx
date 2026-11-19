import type { Metadata } from "next";
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
      <LegacyStyles page="home" />
      <HomeLegacyMarkup />
    </>
  );
}