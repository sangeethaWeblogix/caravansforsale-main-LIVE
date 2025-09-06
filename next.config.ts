import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  remotePatterns: [
    {
      protocol: "https",
      hostname: "**.caravansforsale.com.au", // your blog API image domain
    },
    {
      protocol: "https",
      hostname: "admin.caravansforsale.com.au", // if images served from admin
    },
  ],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
