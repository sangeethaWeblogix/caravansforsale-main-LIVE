import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.dev.caravansforsale.com.au" },
      { protocol: "https", hostname: "www.api.caravansforsale.com.au" },
    ],
  },
};

export default nextConfig;
