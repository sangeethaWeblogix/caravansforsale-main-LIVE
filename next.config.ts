import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true, // bypass Next.js optimization
    remotePatterns: [
      { protocol: "https", hostname: "**.caravansforsale.com.au" },
      { protocol: "https", hostname: "admin.caravansforsale.com.au" },
    ],
  },
};

export default nextConfig;
