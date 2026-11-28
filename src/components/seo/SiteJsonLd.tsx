import {
  INSTRUCTOR_EXPERIENCE,
  OWNER_NAME,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site-seo";

const organizationId = `${SITE_URL}/#organization`;
const founderId = `${SITE_URL}/#founder`;

const graph = [
  {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    publisher: { "@id": organizationId },
  },
  {
    "@type": "Organization",
    "@id": organizationId,
    name: SITE_NAME,
    url: SITE_URL,
    description: "Shopify and e-commerce education and practical training.",
    areaServed: {
      "@type": "Country",
      name: "Pakistan",
    },
    founder: { "@id": founderId },
  },
  {
    "@type": "Person",
    "@id": founderId,
    name: OWNER_NAME,
    jobTitle: "Shopify and E-commerce Trainer",
    description: `Shopify and e-commerce instructor with ${INSTRUCTOR_EXPERIENCE} of experience.`,
    worksFor: { "@id": organizationId },
    image: `${SITE_URL}/img/hero-mentor.webp`,
  },
];

export function SiteJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": graph,
        }),
      }}
    />
  );
}