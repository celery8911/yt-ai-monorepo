import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@yt/ui", "@yt/hooks", "@yt/libs"],
};

export default nextConfig;
