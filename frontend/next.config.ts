import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-origin requests from Google Cloud Agent Builder
  allowedDevOrigins: ["*"],
  experimental: {
    // Enable server actions
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.run.app", "*.web.app"],
    },
  },
};

export default nextConfig;
