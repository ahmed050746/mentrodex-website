import type { Metadata } from "next";

/** Canonical production URL — used in metadata and structured data. */
export const SITE_URL = "https://mentrodex.com";

export const SITE_NAME = "Mentrodex";

/** Site owner / primary mentor (E-E-A-T & JSON-LD). */
export const OWNER_NAME = "MD Ahmed Ali";

/** Marketing name for titles and public copy. */
export const INSTRUCTOR_SHORT_NAME = "MD Ahmed";

export const INSTRUCTOR_EXPERIENCE = "5+ years";

export const COURSE_PRICE_PKR = 4500;

export const DEFAULT_OG_IMAGE = "/img/hero-mentor.webp";

export const HOME_TITLE =
  "Shopify Course in Pakistan | Learn E-commerce – Mentrodex";

export const HOME_DESCRIPTION = `Learn Shopify in Urdu with ${INSTRUCTOR_SHORT_NAME}, an instructor with ${INSTRUCTOR_EXPERIENCE} of experience. Master store creation, product research, marketing and sales through recorded lessons and live classes. Course fee Rs. 4,500.`;

export const PAY_TITLE = "Enroll in Shopify Course | Mentrodex";

export const PAY_DESCRIPTION = `Enroll in ${INSTRUCTOR_SHORT_NAME}'s Shopify and e-commerce training for Rs. 4,500. Learn through practical recorded lessons and live online classes.`;

/** Indexable marketing routes (must match sitemap and canonicals). */
export const PUBLIC_PATHS = ["/", "/pay"] as const;

export type PublicPathname = (typeof PUBLIC_PATHS)[number];

/** Google Search Console HTML-tag verification (visible in page source). */
export const GOOGLE_SITE_VERIFICATION =
  "DC_tH9oVrjoewDOO45u5WWUCH4AujNdHgo2QpPz1yJA";

const OG_IMAGE_ALT = `${SITE_NAME} — Shopify and e-commerce course in Pakistan`;

export function publicCanonicalUrl(pathname: PublicPathname): string {
  return pathname === "/" ? SITE_URL : `${SITE_URL}${pathname}`;
}

export function buildPublicMetadata({
  title,
  description,
  pathname,
}: {
  title: string;
  description: string;
  pathname: PublicPathname;
}): Metadata {
  const canonical = publicCanonicalUrl(pathname);

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      locale: "en_PK",
      type: "website",
      siteName: SITE_NAME,
      images: [{ url: DEFAULT_OG_IMAGE, alt: OG_IMAGE_ALT }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}