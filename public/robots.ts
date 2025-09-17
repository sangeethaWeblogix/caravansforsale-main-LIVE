// app/robots.ts
import { MetadataRoute } from "next";

const BASE_URL = "https://www.caravansforsale.com.au";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/api"], // disallow backend/admin paths
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
