import { resolve } from "node:path";
import { defineConfig } from "vite";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 Vite 库构建配置
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default defineConfig({
	build: {
		// 📚 库模式配置
		lib: {
			// 入口文件
			entry: resolve(__dirname, "src/index.ts"),

			// 库名称（用于 UMD/IIFE 格式）
			name: "QincaiUI",

			// 输出文件名
			fileName: (format) => `index.${format}.js`,

			// 输出格式：ES Module
			formats: ["es"],
		},

		// 🎯 Rollup 配置
		rollupOptions: {
			// 外部化依赖（不打包进库）
			external: [
				"react",
				"react-dom",
				"react/jsx-runtime",
				"@radix-ui/react-dialog",
			],

			// 输出配置
			output: {
				// 保留模块结构（方便 tree-shaking）
				preserveModules: true,
				preserveModulesRoot: "src",

				// 全局变量名（用于 UMD 格式）
				globals: {
					react: "React",
					"react-dom": "ReactDOM",
					"react/jsx-runtime": "jsxRuntime",
				},
			},
		},

		// 输出目录
		outDir: "dist",

		// 清空输出目录
		emptyOutDir: true,

		// 生成 sourcemap
		sourcemap: true,
	},
});
