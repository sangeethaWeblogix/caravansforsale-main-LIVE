// app/sitemap.ts
import { MetadataRoute } from "next";

// Change this to your live domain
const BASE_URL = "https://www.caravansforsale.com.au";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ✅ Static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // ✅ Dynamic routes (example: listings or blog posts)
  const res = await fetch(`${BASE_URL}/api/listings`, {
    // Make sure API is public or adjust headers if needed
    next: { revalidate: 60 * 60 }, // cache 1 hour
  });

  const listings: { slug: string; updatedAt: string }[] = await res.json();

  const dynamicRoutes: MetadataRoute.Sitemap = listings.map((item) => ({
    url: `${BASE_URL}/listings/${item.slug}`,
    lastModified: item.updatedAt ? new Date(item.updatedAt) : new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...dynamicRoutes];
}
