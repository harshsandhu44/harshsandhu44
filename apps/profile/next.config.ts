import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@harshsandhu44/ui", "@harshsandhu44/utils", "@harshsandhu44/theme"],
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
