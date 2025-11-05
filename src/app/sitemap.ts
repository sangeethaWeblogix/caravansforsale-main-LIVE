// src/app/sitemap.ts
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.caravansforsale.com.au";

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}/general-sitemap.xml`,
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}/search-sitemap.xml`,
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}/blogs-sitemap.xml`,
      lastModified: new Date(),
    },
    // {
    //   url: `${siteUrl}/listings-sitemap.xml`,
    //   lastModified: new Date(),
    // },
    // {
    //   url: `${siteUrl}/products-sitemap.xml`,
    //   lastModified: new Date(),
    // },
    {
      url: `${siteUrl}/makes-sitemap.xml`,
      lastModified: new Date(),
    },
    // {
    //   url: `${siteUrl}/states-sitemap.xml`,
    //   lastModified: new Date(),
    // },
    {
      url: `${siteUrl}/locations-sitemap.xml`,
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}/categories-sitemap.xml`,
      lastModified: new Date(),
    },
    // {
    //   url: `${siteUrl}/regions-sitemap.xml`,
    //   lastModified: new Date(),
    // },
    {
      url: `${siteUrl}/prices-sitemap.xml`,
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}/weights-sitemap.xml`,
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}/sleeps-sitemap.xml`,
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}/length-sitemap.xml`,
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}/conditions-sitemap.xml`,
      lastModified: new Date(),
    },
  ];
}
