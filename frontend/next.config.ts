import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Docker/Cloud Run deployment
  output: "standalone",
  // Allow cross-origin requests from Google Cloud Agent Builder
  allowedDevOrigins: ["*"],
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.run.app", "*.web.app"],
    },
  },
};

export default nextConfig;
