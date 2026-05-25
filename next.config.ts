import type { NextConfig } from "next";

const basePath = process.env.WAR_BASEPATH || "";

const nextConfig: NextConfig = {
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
