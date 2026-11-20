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
    default: "AI Web Crafts — E-Commerce Mentorship",
    template: "%s | AI Web Crafts",
  },
  description:
    "1-on-1 Shopify and dropshipping mentorship in Pakistan with AI Web Crafts.",
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