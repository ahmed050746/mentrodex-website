import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import { MetaAnalytics } from "@/components/meta/MetaAnalytics";
import { MetaPixel } from "@/components/meta/MetaPixel";
import { SiteJsonLd } from "@/components/seo/SiteJsonLd";
import {
  DEFAULT_OG_IMAGE,
  GOOGLE_SITE_VERIFICATION,
  HOME_DESCRIPTION,
  HOME_TITLE,
  OWNER_NAME,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site-seo";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const defaultOgImageAlt = `${SITE_NAME} — Shopify and e-commerce course in Pakistan`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: HOME_TITLE,
    template: "%s | Mentrodex",
  },
  description: HOME_DESCRIPTION,
  authors: [{ name: OWNER_NAME, url: SITE_URL }],
  creator: OWNER_NAME,
  publisher: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "en_PK",
    siteName: SITE_NAME,
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE, alt: defaultOgImageAlt }],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  icons: { icon: "/img/logo-m.png" },
  verification: {
    google:
      process.env.GOOGLE_SITE_VERIFICATION?.trim() || GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`page-v2 ${inter.variable} ${plusJakarta.variable}`}
    >
      <body>
        <SiteJsonLd />
        <MetaPixel />
        <Suspense fallback={null}>
          <MetaAnalytics />
        </Suspense>
        {children}
      </body>
    </html>
  );
}