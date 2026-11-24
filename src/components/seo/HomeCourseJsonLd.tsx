import { OWNER_NAME, SITE_NAME, SITE_URL } from "@/lib/site-seo";

export function HomeCourseJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "E-Commerce Mentorship — Shopify, Dropshipping & Marketplaces",
    description:
      "1-on-1 mentorship program in Pakistan covering Shopify, dropshipping, and marketplace selling.",
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    instructor: {
      "@type": "Person",
      name: OWNER_NAME,
      url: SITE_URL,
    },
    offers: {
      "@type": "Offer",
      price: "4500",
      priceCurrency: "PKR",
      url: `${SITE_URL}/pay`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}