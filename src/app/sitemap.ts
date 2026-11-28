import type { MetadataRoute } from "next";
import { PUBLIC_PATHS, publicCanonicalUrl } from "@/lib/site-seo";

/** Public marketing pages only (admin, portal, and API are excluded via robots.txt). */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_PATHS.map((pathname) => ({
    url: publicCanonicalUrl(pathname),
    lastModified,
    changeFrequency: pathname === "/" ? "weekly" : "monthly",
    priority: pathname === "/" ? 1 : 0.9,
  }));
}