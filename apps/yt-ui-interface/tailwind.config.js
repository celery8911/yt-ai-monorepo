/** @type {import('tailwindcss').Config} */
import animate from "tailwindcss-animate";

export default {
	content: [
		// 扫描 stories 目录下的所有文件（包括 MDX 文档）
		"./stories/**/*.{js,jsx,ts,tsx,mdx}",

		// 扫描 src 目录下的所有源文件
		"./src/**/*.{js,jsx,ts,tsx}",

		// 扫描 @yt/ui 组件库的源文件
		// 因为组件使用 workspace 依赖（workspace:*），Storybook 直接引用源码
		// Tailwind 需要扫描组件库中的 className 来生成对应的样式
		"../../packages/yt-ui/src/**/*.{js,jsx,ts,tsx}",
	],
	theme: {
		extend: {
			colors: {
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			fontFamily: {
				sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
			},
		},
	},
	plugins: [animate],
};
