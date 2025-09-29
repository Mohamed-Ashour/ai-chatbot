import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true
  },
  experimental: {
    serverComponentsExternalPackages: []
  }
};

export default nextConfig;
