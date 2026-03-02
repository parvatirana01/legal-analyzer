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

  // Turbopack (default in Next.js 16) — silence the no-config warning.
  // react-pdf's optional "canvas" peer dep is not installed; Turbopack
  // skips missing optional native modules without an alias.
  turbopack: {},
};

export default nextConfig;
