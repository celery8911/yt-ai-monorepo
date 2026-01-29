import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone",
	reactStrictMode: false,
	typescript: {
		ignoreBuildErrors: true,
	},
	transpilePackages: ["@yt/ui", "@yt/hooks", "@yt/libs"],
	images: {
		unoptimized: true, // 禁用图片优化，避免 OpenNext 兼容性问题
		dangerouslyAllowSVG: true,
		contentSecurityPolicy:
			"default-src 'self'; img-src 'self' data: https:; script-src 'none'; sandbox;",
		remotePatterns: [
			{
				protocol: "https",
				hostname: "api.dicebear.com",
			},
		],
	},
};

export default nextConfig;
