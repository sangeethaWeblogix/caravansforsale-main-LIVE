import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  reactStrictMode: false,

 images: {
    unoptimized: false,
    domains: [
      "media.caravansforsale.com.au",
      "www.caravansforsale.com.au",
       "www.admin.caravansforsale.com.au",
      "caravansforsale.b-cdn.net",
      "wb79vudhmjvv4ng6.public.blob.vercel-storage.com",
      "caravansforsale.imagestack.net",
    ],
      remotePatterns: [
      {
        protocol: "https",
        hostname: "www.admin.caravansforsale.com.au",
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
  },

  compiler: {
    removeConsole: true,
  },

  // ✅ Redirect malformed URLs like /feedfeedfeedfeed → clean version
  async redirects() {
    return [
      {
        source: "/:path*feedfeed:rest*", // matches /anything/feedfeedfeedfeed etc.
        destination: "/:path*", // redirect to clean URL
        permanent: true, // 301 redirect for SEO
      },
      {
        source: "/:path*(feed)+:rest*", // also catch single feed or partial ones
        destination: "/:path*",
        permanent: true,
      },
      {
        source: "/:path*(feed)+", // final catch-all safety net
        destination: "/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
