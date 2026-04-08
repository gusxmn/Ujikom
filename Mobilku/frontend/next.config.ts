import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    root: path.join(__dirname, './'),
  },
  reactStrictMode: false, // Disable strict mode to suppress hydration warnings in dev
};

export default nextConfig;
