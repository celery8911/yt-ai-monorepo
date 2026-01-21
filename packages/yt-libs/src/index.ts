// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 @yt/libs - 通用工具函数库
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 🎯 库的目标
 *
 * 提供一系列通用、类型安全、文档完善的工具函数
 * - 不依赖特定框架（可用于 React、Vue、Svelte 等）
 * - 完全使用 TypeScript 编写
 * - 每个函数都有详细的中文注释
 * - 适用于 Web3、常规 Web 开发等场景
 *
 * 📚 模块组织
 * - address: 地址相关工具（钱包地址格式化等）
 * - string: 字符串处理工具
 * - number: 数字处理工具
 * - date: 日期处理工具
 * - ...更多模块待添加
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 导出地址工具
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 导出地址相关的工具函数和类型
 *
 * 🔍 export { ... } from '...' 语法说明：
 * - 这是 ES6 的 re-export（重新导出）语法
 * - 作用：从其他模块导入，然后立即导出
 * - 好处：统一入口，用户只需从 '@yt/libs' 导入
 *
 * 📖 示例：
 * ```ts
 * // ❌ 不推荐：深层导入
 * import { formatAddress } from '@yt/libs/address/formatAddress';
 *
 * // ✅ 推荐：从根模块导入
 * import { formatAddress } from '@yt/libs';
 * ```
 */
// 导出地址工具函数和类型
export {
	type FormatAddressOptions,
	formatAddress,
} from "./address/formatAddress";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 导出 HTTP 请求工具
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export {
	createHttpClient,
	getHttpClient,
	request,
	setHttpClientOptions,
} from "./http/client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 导出智能合约配置
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export * from "./contracts";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📖 使用示例
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 完整使用示例
 *
 * ```ts
 * // 1️⃣ 安装包
 * // npm install @yt/libs
 * // 或
 * // pnpm add @yt/libs
 *
 * // 2️⃣ 导入函数
 * import { formatAddress } from '@yt/libs';
 *
 * // 3️⃣ 使用函数
 * const address = '0x1234567890abcdef1234567890abcdef12345678';
 * const formatted = formatAddress(address);
 * console.log(formatted); // '0x1234...5678'
 *
 * // 4️⃣ 使用自定义选项
 * import type { FormatAddressOptions } from '@yt/libs';
 *
 * const options: FormatAddressOptions = {
 *   prefixLength: 8,
 *   suffixLength: 6,
 *   ellipsis: '****'
 * };
 *
 * const customFormatted = formatAddress(address, options);
 * console.log(customFormatted); // '0x123456****345678'
 * ```
 */

/**
 * React 中使用示例
 *
 * ```tsx
 * import { formatAddress } from '@yt/libs';
 *
 * function WalletDisplay({ address }: { address: string }) {
 *   return (
 *     <div className="wallet">
 *       <span className="address">
 *         {formatAddress(address)}
 *       </span>
 *     </div>
 *   );
 * }
 * ```
 */

/**
 * Vue 中使用示例
 *
 * ```vue
 * <script setup lang="ts">
 * import { formatAddress } from '@yt/libs';
 *
 * const address = '0x1234567890abcdef1234567890abcdef12345678';
 * const formatted = formatAddress(address);
 * </script>
 *
 * <template>
 *   <div class="wallet">
 *     {{ formatted }}
 *   </div>
 * </template>
 * ```
 */
