import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse and mammoth use Node.js fs/path APIs — keep them server-side only
  serverExternalPackages: ["pdf-parse", "mammoth"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
