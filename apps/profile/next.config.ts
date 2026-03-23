import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.harshsandhu.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
