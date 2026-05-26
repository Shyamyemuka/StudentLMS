import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Explicitly expose environment variables (workaround for Turbopack + workspace setup)
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/avif", "image/webp"], // Modern image formats for better compression
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // Responsive image sizes
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Icon sizes
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "30mb",
    },
    serverExternalPackages: ["lightningcss", "@tailwindcss/oxide"],
  },
  turbopack: {
    root: path.resolve(__dirname, ".."),
    resolveAlias: {
      "react": "./node_modules/react",
      "react-dom": "./node_modules/react-dom",
    },
  },
  // Suppress hydration warnings caused by browser extensions
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // Performance optimizations
  compress: true, // Enable gzip/brotli compression
  poweredByHeader: false, // Remove X-Powered-By header
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "react": path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    };
    return config;
  },
};

export default nextConfig;
