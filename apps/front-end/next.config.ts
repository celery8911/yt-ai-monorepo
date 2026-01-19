import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  transpilePackages: ["@yt/ui", "@yt/hooks", "@yt/libs"],
};

export default nextConfig;
