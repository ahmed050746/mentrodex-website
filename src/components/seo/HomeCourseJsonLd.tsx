import {
  COURSE_PRICE_PKR,
  OWNER_NAME,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site-seo";

const COURSE_NAME = "Shopify & E-commerce Course";

const COURSE_DESCRIPTION =
  "Practical Shopify and e-commerce training in Pakistan. Learn Shopify store creation, product research, product listing, store design, marketing and sales in Urdu through recorded lessons and live classes.";

export function HomeCourseJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: COURSE_NAME,
    description: COURSE_DESCRIPTION,
    inLanguage: ["ur", "ur-Latn"],
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    instructor: {
      "@type": "Person",
      name: OWNER_NAME,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      inLanguage: ["ur", "ur-Latn"],
    },
    offers: {
      "@type": "Offer",
      price: String(COURSE_PRICE_PKR),
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