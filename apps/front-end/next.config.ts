import type { NextConfig } from "next";

const apiProxyTarget =
	process.env.API_PROXY_TARGET ??
	process.env.NEXT_PUBLIC_API_BASE_URL ??
	"http://localhost:4000/api";

const nextConfig: NextConfig = {
	reactStrictMode: false,
	transpilePackages: ["@yt/ui", "@yt/hooks", "@yt/libs"],
	images: {
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
	async rewrites() {
		return [
			{
				source: "/api/:path*",
				destination: `${apiProxyTarget.replace(/\/$/, "")}/:path*`,
			},
		];
	},
};

export default nextConfig;
