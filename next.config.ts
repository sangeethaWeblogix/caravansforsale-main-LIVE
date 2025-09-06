import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true, // bypass Next.js optimization
  },
};

export default nextConfig;
