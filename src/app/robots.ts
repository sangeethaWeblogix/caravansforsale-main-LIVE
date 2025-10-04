import { MetadataRoute } from "next";

const BASE_URL = "https://www.caravansforsale.com.au";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*", // applies to all crawlers
        allow: "/", // allow all public pages
        disallow: [
          "/*?add-to-cart=", // block WooCommerce cart query URLs
          "/*&add-to-cart=",
          "/admin", // block admin area
          "/dashboard", // block dashboard
          "/api", // block backend APIs
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
