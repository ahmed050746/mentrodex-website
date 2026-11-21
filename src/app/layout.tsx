import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import { MetaAnalytics } from "@/components/meta/MetaAnalytics";
import { MetaPixel } from "@/components/meta/MetaPixel";
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
  title: {
    default: "Mentrodex — E-Commerce Mentorship",
    template: "%s | Mentrodex",
  },
  description:
    "1-on-1 Shopify and dropshipping mentorship in Pakistan with Mentrodex.",
  icons: { icon: "/img/logo.png" },
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
      <head>
        <link rel="preconnect" href="https://player.mediadelivery.net" />
        <link rel="dns-prefetch" href="https://video.bunnycdn.com" />
        <link rel="dns-prefetch" href="https://vz-40eaeb89-41e.b-cdn.net" />
      </head>
      <body>
        <MetaPixel />
        <Suspense fallback={null}>
          <MetaAnalytics />
        </Suspense>
        {children}
      </body>
    </html>
  );
}