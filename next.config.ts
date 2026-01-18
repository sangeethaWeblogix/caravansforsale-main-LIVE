import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  reactStrictMode: false,
  //  productionBrowserSourceMaps: false,
 images: {
    unoptimized: true,
    domains: [
      "media.caravansforsale.com.au",
      "www.caravansforsale.com.au",
       "admin.caravansforsale.com.au",
      "caravansforsale.b-cdn.net",
      "wb79vudhmjvv4ng6.public.blob.vercel-storage.com",
      "caravansforsale.imagestack.net",
    ],
      remotePatterns: [
      {
        protocol: "https",
        hostname: "admin.caravansforsale.com.au",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "admin.caravansforsale.com.au",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "caravansforsale.b-cdn.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.caravansforsale.com.au",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
  },
  compress: true,
 
  async rewrites() {
    return [
      {
        source: "/blob/:path*",
        destination:
          "https://wb79vudhmjvv4ng6.public.blob.vercel-storage.com/:path*",
      },
    ];
  },
  experimental: {
    // ✅ Built-in critical CSS inlining
    optimizeCss: true,
    scrollRestoration: true,
  },

  // compiler: {
  //   removeConsole: true,
  // },

  // ✅ Redirect malformed URLs like /feedfeedfeedfeed → clean version
  async redirects() {
    return [
       {
      source: "/:path*/feed/:rest*",
      destination: "/:path*",
      permanent: true,
    },
    {
      source: "/:path*/feedfeed/:rest*",
      destination: "/:path*",
      permanent: true,
    },
    {
      source: "/:path*/feedfeedfeed/:rest*",
      destination: "/:path*",
      permanent: true,
    },
    ];

  },
  async headers() {
    return [
      // ===========================================
      // LISTINGS PAGES - Main caching targets
      // ===========================================
      
      // Main listings page
      {
        source: "/listings/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
          {
            key: "CDN-Cache-Control",
            value: "public, max-age=3600",
          },
        ],
      },
      
      // All listing subpages (filters, categories, makes, etc.)
      {
        source: "/listings/:path*/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
          {
            key: "CDN-Cache-Control",
            value: "public, max-age=3600",
          },
        ],
      },

      // ===========================================
      // CATEGORY PAGES
      // ===========================================
      {
        source: "/:slug-category/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },

      // ===========================================
      // CONDITION PAGES
      // ===========================================
      {
        source: "/new-condition/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/used-condition/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },

      // ===========================================
      // STATE/LOCATION PAGES
      // ===========================================
      {
        source: "/:state-state/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },

      // ===========================================
      // STATIC ASSETS - Long cache
      // ===========================================
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },

      // ===========================================
      // IMAGES - 24 hour cache
      // ===========================================
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },

      // ===========================================
      // API ROUTES - No cache
      // ===========================================
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
