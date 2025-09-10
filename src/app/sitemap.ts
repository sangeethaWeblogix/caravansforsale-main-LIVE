// src/app/sitemap.ts
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://caravansforsale.com.au";

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}/blogs-sitemap.xml`,
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}/listigs-sitemap.xml`,
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}/makes-sitemap.xml`,
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}/states-sitemap.xml`,
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}/makes-sitemap.xml`,
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}/regions-sitemap.xml`,
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}/prices-sitemap.xml`,
      lastModified: new Date(),
    },
  ];
}
