// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 Rollup 配置 - 专业的库打包工具
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 🎯 为什么用 Rollup？
 *
 * Rollup 是专为库（libraries）设计的打包工具，相比 Webpack 和 Vite：
 * ✅ 更小的产物体积（tree-shaking 更激进）
 * ✅ 更清晰的输出代码（接近手写）
 * ✅ 对 ES 模块的原生支持
 * ✅ 被大量知名库使用（React、Vue、Lodash 等）
 *
 * Vite 底层也是用 Rollup，但 Vite 主要面向应用开发
 */

import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import peerDepsExternal from "rollup-plugin-peer-deps-external";

export default {
	// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	// 📥 入口文件
	// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

	/**
	 * input: 打包的入口文件
	 *
	 * 📖 说明：
	 * - Rollup 从这个文件开始，沿着 import 链找到所有依赖
	 * - 可以是单个文件（字符串）或多个文件（数组/对象）
	 *
	 * 📚 示例：
	 * input: 'src/index.ts'              // 单入口
	 * input: ['src/a.ts', 'src/b.ts']    // 多入口（数组）
	 * input: { main: 'src/index.ts' }    // 多入口（对象）
	 */
	input: "src/index.ts",

	// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	// 📤 输出配置
	// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

	/**
	 * output: 定义打包后的输出文件
	 *
	 * 🔍 常见格式（format）：
	 * - 'es' (ESM): import/export 语法，现代浏览器和打包工具支持
	 * - 'cjs' (CommonJS): require/module.exports，Node.js 环境
	 * - 'umd' (UMD): 通用模块，同时支持浏览器 <script> 和 CommonJS/AMD
	 * - 'iife': 立即执行函数，浏览器 <script> 标签
	 *
	 * 💡 库推荐：
	 * - 纯前端库：只输出 'es' 格式（现代化）
	 * - Node.js 库：输出 'es' + 'cjs'
	 * - 浏览器直接使用：输出 'umd' 或 'iife'
	 */
	output: [
		{
			/**
			 * dir: 输出目录
			 *
			 * ⚠️ 重要：
			 * - 当使用 preserveModules: true 时，必须用 dir 而不是 file
			 * - 因为会输出多个文件，不能指定单个文件名
			 *
			 * file vs dir:
			 * - file: 'dist/index.js'  → 单文件输出（不保留模块结构）
			 * - dir: 'dist'            → 多文件输出（保留模块结构）
			 */
			dir: "dist",

			/**
			 * format: 输出格式
			 *
			 * 选择 'es' 的原因：
			 * - 现代打包工具（Webpack、Vite、Rollup）都支持
			 * - 天然支持 tree-shaking（摇树优化）
			 * - 最接近 ESM 标准
			 */
			format: "es",

			/**
			 * sourcemap: 生成源码映射文件
			 *
			 * 📖 作用：
			 * - 调试时能看到原始 TypeScript 代码
			 * - 浏览器 DevTools 会自动加载 .map 文件
			 *
			 * 💡 选项：
			 * - true: 生成独立的 .js.map 文件
			 * - 'inline': 将 sourcemap 嵌入 JS 文件
			 * - false: 不生成
			 */
			sourcemap: true,

			/**
			 * preserveModules: 保留模块结构
			 *
			 * 🎯 重要概念！
			 *
			 * preserveModules: false (默认)
			 * ├── dist/
			 * │   └── index.es.js  (所有代码打包成一个文件)
			 *
			 * preserveModules: true
			 * ├── dist/
			 * │   ├── index.js
			 * │   ├── hooks/
			 * │   │   └── useImmer.js
			 * │   └── examples/
			 * │       └── useImmer.example.js
			 *
			 * ✅ 好处：
			 * - 更好的 tree-shaking（用户只导入需要的模块）
			 * - 更清晰的代码结构
			 * - 符合 ESM 规范
			 *
			 * ⚠️ 注意：
			 * - 只对 'es' 格式有意义
			 * - 会生成多个文件
			 */
			preserveModules: true,

			/**
			 * preserveModulesRoot: 保留模块的根目录
			 *
			 * 📖 说明：
			 * 指定源码的根目录，影响输出的目录结构
			 *
			 * 不设置时：
			 * src/hooks/useImmer.ts → dist/src/hooks/useImmer.js
			 *
			 * 设置为 'src'：
			 * src/hooks/useImmer.ts → dist/hooks/useImmer.js
			 *
			 * ✅ 推荐设置，让输出结构更简洁
			 */
			preserveModulesRoot: "src",
		},
	],

	// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	// 🔌 插件配置
	// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

	/**
	 * plugins: Rollup 插件数组
	 *
	 * 📖 执行顺序：
	 * 插件按数组顺序执行，顺序很重要！
	 * 一般规则：外部化 → 解析 → 转换 → 压缩
	 */
	plugins: [
		/**
		 * 1️⃣ peerDepsExternal - 自动外部化 peerDependencies
		 *
		 * 🎯 作用：
		 * 读取 package.json 的 peerDependencies 字段
		 * 自动将这些依赖标记为 external，不打包进产物
		 *
		 * 📖 示例：
		 * package.json 中有：
		 * "peerDependencies": {
		 *   "react": "^18.0.0",
		 *   "immer": "^11.0.0"
		 * }
		 *
		 * 这个插件会自动处理，等价于：
		 * external: ['react', 'immer']
		 *
		 * ✅ 好处：
		 * - 避免重复打包（用户项目已有这些依赖）
		 * - 减小产物体积
		 * - 保证版本一致性
		 */
		peerDepsExternal(),

		/**
		 * 2️⃣ resolve - 解析 node_modules 中的依赖
		 *
		 * 🎯 作用：
		 * Rollup 默认只处理相对路径的导入
		 * 这个插件让 Rollup 能找到 node_modules 中的包
		 *
		 * 📖 示例：
		 * 没有这个插件：
		 * import { produce } from 'immer';  // ❌ 找不到
		 *
		 * 有这个插件：
		 * import { produce } from 'immer';  // ✅ 能正确解析
		 *
		 * 💡 配置选项：
		 * resolve({
		 *   extensions: ['.js', '.ts'],  // 解析的文件扩展名
		 *   browser: true,               // 优先使用 browser 字段
		 * })
		 */
		resolve(),

		/**
		 * 3️⃣ typescript - 处理 TypeScript 文件
		 *
		 * 🎯 作用：
		 * - 将 .ts/.tsx 编译为 JavaScript
		 * - 生成类型声明文件 (.d.ts)
		 *
		 * 📖 配置说明：
		 */
		typescript({
			/**
			 * declaration: 生成 .d.ts 类型声明文件
			 *
			 * true: 生成类型文件
			 * false: 不生成（不推荐）
			 */
			declaration: true,

			/**
			 * declarationDir: 类型文件输出目录
			 *
			 * 指定 .d.ts 文件的输出位置
			 * 通常和 JS 文件放在同一个 dist 目录
			 */
			declarationDir: "dist",

			/**
			 * exclude: 排除不需要编译的文件
			 *
			 * 📖 使用场景：
			 * - 排除测试文件: '**\/*.test.ts'
			 * - 排除示例文件: 'src/examples/**'
			 * - 排除配置文件: '**\/*.config.ts'
			 *
			 * 💡 支持 glob 模式
			 */
			exclude: ["src/examples/**"],

			/**
			 * 其他常用选项：
			 *
			 * tsconfig: './tsconfig.json'  // 指定 tsconfig 文件
			 * sourceMap: true               // 生成 sourcemap
			 * noEmitOnError: true           // 类型错误时停止构建
			 */
		}),
	],

	// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	// 🚫 外部依赖配置
	// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

	/**
	 * external: 外部依赖列表
	 *
	 * 🎯 作用：
	 * 告诉 Rollup 哪些模块不要打包，保留 import 语句
	 *
	 * 📖 示例：
	 * 源码：
	 * import { useState } from 'react';
	 *
	 * external: ['react'] 后的输出：
	 * import { useState } from 'react';  // ✅ 保留 import
	 *
	 * 没有 external 的输出：
	 * // ❌ 会尝试打包整个 React 源码
	 *
	 * 💡 为什么需要？
	 * 1. 避免重复打包
	 *    用户项目已经安装了 React，不需要再打包一份
	 *
	 * 2. 保证版本一致
	 *    用户使用自己安装的 React 版本
	 *
	 * 3. 减小体积
	 *    React 本身很大，不应该打包进库
	 *
	 * 🔍 匹配规则：
	 * external: ['react']              // 精确匹配
	 * external: [/^react/]             // 正则匹配（匹配 react-dom 等）
	 * external: (id) => id.includes()  // 函数判断
	 *
	 * ⚠️ 注意：
	 * peerDepsExternal 插件已经自动处理了大部分情况
	 * 这里显式声明是为了额外保险
	 */
	external: [
		"react",
		"react-dom",
		"react/jsx-runtime", // React 17+ 的 JSX 运行时
		"immer",
	],
};

/**
 * 📚 总结：Rollup 配置的核心概念
 *
 * 1. 入口（input）→ 插件处理 → 输出（output）
 *
 * 2. 外部化（external）很重要
 *    - peerDependencies 应该外部化
 *    - 运行时依赖可以打包或外部化（看情况）
 *
 * 3. preserveModules 提升 tree-shaking
 *    - 对库来说是最佳实践
 *    - 让用户只加载需要的部分
 *
 * 4. sourcemap 帮助调试
 *    - 开发体验更好
 *    - 生产环境也建议保留
 *
 * 5. TypeScript 插件负责类型
 *    - 生成 .d.ts 供用户使用
 *    - 保证类型安全
 */
