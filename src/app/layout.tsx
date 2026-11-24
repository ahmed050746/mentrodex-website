import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import { MetaAnalytics } from "@/components/meta/MetaAnalytics";
import { MetaPixel } from "@/components/meta/MetaPixel";
import { SiteJsonLd } from "@/components/seo/SiteJsonLd";
import { OWNER_NAME, SITE_NAME, SITE_URL } from "@/lib/site-seo";
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mentrodex — E-Commerce Mentorship",
    template: "%s | Mentrodex",
  },
  description: `1-on-1 Shopify and dropshipping mentorship in Pakistan with ${OWNER_NAME}, founder of ${SITE_NAME}.`,
  authors: [{ name: OWNER_NAME, url: SITE_URL }],
  creator: OWNER_NAME,
  publisher: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "en_PK",
    siteName: SITE_NAME,
    title: "Mentrodex — E-Commerce Mentorship",
    description: `Learn e-commerce with ${OWNER_NAME} — Shopify, dropshipping, and marketplace mentorship in Pakistan.`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Mentrodex — E-Commerce Mentorship",
    description: `1-on-1 mentorship in Pakistan with ${OWNER_NAME}.`,
  },
  icons: { icon: "/img/logo-m.png" },
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