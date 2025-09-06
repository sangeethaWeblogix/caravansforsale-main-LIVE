import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: false, // ✅ if you want Next.js optimization
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.caravansforsale.com.au",
      },
      {
        protocol: "https",
        hostname: "admin.caravansforsale.com.au",
      },
    ],
  },
};

export default nextConfig;
