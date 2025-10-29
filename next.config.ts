import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,

  images: {
    unoptimized: true,
    domains: [
      // allow both your blob domain and custom domain
      "wb79vudhmjvv4ng6.public.blob.vercel-storage.com",
      "media.caravansforsale.com.au",
      "www.caravansforsale.com.au",
    ],
  },
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
    removeConsole: false,
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
