import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    root: path.join(__dirname, './'),
  },
  reactStrictMode: false, // Disable strict mode to suppress hydration warnings in dev
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/images/**',
      },
    ],
    unoptimized: true, // Disable image optimization for local testing
  },
};

export default nextConfig;
