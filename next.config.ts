import type { NextConfig } from "next";

const dev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Lets forms work inside GitHub Codespaces during development only.
      allowedOrigins: dev ? ["localhost:3000", "*.app.github.dev", "*.github.dev"] : [],
    },
  },
};

export default nextConfig;
