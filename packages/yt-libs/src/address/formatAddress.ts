// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 钱包地址格式化工具
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 🎯 什么是钱包地址？
 *
 * 钱包地址是区块链上的唯一标识符，类似于银行账号
 * 不同链的地址格式：
 * - 以太坊 (Ethereum): 0x 开头，42 位 (0x + 40个十六进制字符)
 *   例如: 0x1234567890abcdef1234567890abcdef12345678
 *
 * - 比特币 (Bitcoin): 1/3/bc1 开头，26-42 位
 *   例如: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
 *
 * - Solana: 32-44 位 Base58 编码
 *   例如: 7EqQdEUaxGkzPfHpJTbcS4H8LZNQXiVmZvKmQQqQqQqQ
 *
 * 📚 为什么要格式化？
 * 1. 地址太长，在 UI 上显示不友好
 * 2. 用户只需要看到地址的开头和结尾即可识别
 * 3. 节省屏幕空间
 *
 * 常见格式：
 * - 完整: 0x1234567890abcdef1234567890abcdef12345678
 * - 省略: 0x1234...5678
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 TypeScript 类型定义
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 格式化选项
 */
export interface FormatAddressOptions {
	/**
	 * 前缀保留字符数
	 * @default 6
	 *
	 * 📖 说明：
	 * - 以太坊地址: 0x1234... → 保留 6 位包含 0x
	 * - 建议 4-8 位，太少不易识别，太多失去格式化意义
	 */
	prefixLength?: number;

	/**
	 * 后缀保留字符数
	 * @default 4
	 *
	 * 📖 说明：
	 * - ...5678 → 保留 4 位
	 * - 通常比 prefix 少一些
	 */
	suffixLength?: number;

	/**
	 * 中间省略符号
	 * @default '...'
	 *
	 * 📖 说明：
	 * - 可以使用 '...'、'…'、'****' 等
	 */
	ellipsis?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎨 格式化函数实现
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 格式化钱包地址
 *
 * @param address - 完整的钱包地址
 * @param options - 格式化选项
 * @returns 格式化后的地址
 *
 * 💡 实现原理：
 * 1. 参数验证：检查地址是否有效
 * 2. 长度判断：如果地址够短，直接返回
 * 3. 字符串切割：提取前缀和后缀
 * 4. 拼接结果：prefix + ellipsis + suffix
 *
 * 📖 使用示例：
 * ```ts
 * // 基础用法
 * formatAddress('0x1234567890abcdef1234567890abcdef12345678')
 * // → '0x1234...5678'
 *
 * // 自定义长度
 * formatAddress('0x1234567890abcdef1234567890abcdef12345678', {
 *   prefixLength: 8,
 *   suffixLength: 6
 * })
 * // → '0x123456...345678'
 *
 * // 自定义省略符
 * formatAddress('0x1234567890abcdef1234567890abcdef12345678', {
 *   ellipsis: '****'
 * })
 * // → '0x1234****5678'
 * ```
 */
export function formatAddress(
	address: string,
	options: FormatAddressOptions = {},
): string {
	// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	// 1️⃣ 参数处理和验证
	// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

	/**
	 * 解构默认值
	 *
	 * 🔍 使用 ES6 解构赋值 + 默认值语法
	 * - 如果 options.prefixLength 存在，使用它
	 * - 否则使用默认值 6
	 */
	const { prefixLength = 6, suffixLength = 4, ellipsis = "..." } = options;

	/**
	 * 参数验证
	 *
	 * 📖 验证规则：
	 * 1. address 必须是字符串
	 * 2. address 不能为空
	 * 3. address 长度必须足够
	 *
	 * ⚠️ 为什么要验证？
	 * - 防止传入 null、undefined 导致运行时错误
	 * - 提供清晰的错误信息
	 * - 避免无意义的格式化
	 */
	if (!address || typeof address !== "string") {
		/**
		 * 边界情况处理
		 *
		 * 💡 策略选择：
		 * - 方案 A: 抛出错误 throw new Error('Invalid address')
		 * - 方案 B: 返回空字符串 return ''
		 * - 方案 C: 返回原值 return address
		 *
		 * ✅ 这里选择返回空字符串
		 * - 不会中断程序执行
		 * - UI 显示友好
		 * - 符合防御性编程原则
		 */
		return "";
	}

	// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	// 2️⃣ 长度判断：地址太短无需格式化
	// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

	/**
	 * 计算格式化后的最小长度
	 *
	 * 📐 公式：prefix + ellipsis + suffix
	 * 例如：6 + 3 + 4 = 13
	 *
	 * 📖 逻辑：
	 * 如果原始地址长度 <= 格式化后的长度，说明格式化没有意义
	 *
	 * 示例：
	 * address = '0x1234' (长度 6)
	 * minLength = 6 + 3 + 4 = 13
	 * 6 <= 13，直接返回 '0x1234'
	 */
	const minLength = prefixLength + ellipsis.length + suffixLength;

	if (address.length <= minLength) {
		/**
		 * 地址太短，直接返回原值
		 *
		 * 💡 为什么？
		 * - 格式化后反而更长：'0x1234' → '0x1234...1234'
		 * - 失去了格式化的意义（节省空间）
		 */
		return address;
	}

	// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	// 3️⃣ 字符串切割：提取前缀和后缀
	// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

	/**
	 * 提取前缀
	 *
	 * 🔍 String.prototype.slice(start, end)
	 * - start: 起始索引（包含）
	 * - end: 结束索引（不包含）
	 *
	 * 📖 示例：
	 * address = '0x1234567890abcdef'
	 * address.slice(0, 6) → '0x1234'
	 *
	 * 索引对应：
	 * 0x1234567890abcdef
	 * 0 1 2 3 4 5
	 * └─────┘
	 *  slice(0, 6)
	 */
	const prefix = address.slice(0, prefixLength);

	/**
	 * 提取后缀
	 *
	 * 🔍 负数索引的妙用
	 * - slice(-4) 表示从倒数第 4 个字符开始
	 * - 等价于 slice(length - 4)
	 *
	 * 📖 示例：
	 * address = '0x1234567890abcdef'
	 * address.slice(-4) → 'cdef'
	 *
	 * 索引对应：
	 * 0x1234567890abcdef
	 *               └───┘
	 *           slice(-4)
	 */
	const suffix = address.slice(-suffixLength);

	// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	// 4️⃣ 拼接并返回结果
	// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

	/**
	 * 使用模板字符串拼接
	 *
	 * 📖 结果：
	 * '0x1234' + '...' + 'cdef' = '0x1234...cdef'
	 *
	 * 💡 为什么用模板字符串？
	 * - 可读性高
	 * - 性能好（现代 JS 引擎优化）
	 * - 易于维护
	 *
	 * 替代方案：
	 * - 字符串拼接: prefix + ellipsis + suffix
	 * - 数组 join: [prefix, ellipsis, suffix].join('')
	 */
	return `${prefix}${ellipsis}${suffix}`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔍 高级用法和最佳实践
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 📚 常见使用场景
 *
 * 1️⃣ React 组件中显示钱包地址
 * ```tsx
 * function WalletAddress({ address }: { address: string }) {
 *   return (
 *     <div className="wallet-address">
 *       {formatAddress(address)}
 *     </div>
 *   );
 * }
 * ```
 *
 * 2️⃣ 表格中显示地址列
 * ```tsx
 * const columns = [
 *   {
 *     title: '钱包地址',
 *     dataIndex: 'address',
 *     render: (address: string) => formatAddress(address, {
 *       prefixLength: 8,
 *       suffixLength: 6
 *     })
 *   }
 * ];
 * ```
 *
 * 3️⃣ 可点击复制的地址
 * ```tsx
 * function CopyableAddress({ address }: { address: string }) {
 *   const handleCopy = () => {
 *     navigator.clipboard.writeText(address);
 *   };
 *
 *   return (
 *     <span
 *       onClick={handleCopy}
 *       title={address} // 悬停显示完整地址
 *     >
 *       {formatAddress(address)}
 *     </span>
 *   );
 * }
 * ```
 *
 * 4️⃣ 响应式显示（移动端显示更短）
 * ```tsx
 * function ResponsiveAddress({ address }: { address: string }) {
 *   const isMobile = useMediaQuery('(max-width: 768px)');
 *
 *   return (
 *     <span>
 *       {formatAddress(address, {
 *         prefixLength: isMobile ? 4 : 6,
 *         suffixLength: isMobile ? 3 : 4
 *       })}
 *     </span>
 *   );
 * }
 * ```
 */

/**
 * 🔥 性能优化建议
 *
 * 1️⃣ 在大列表中使用 React.memo
 * ```tsx
 * const AddressItem = React.memo(({ address }: { address: string }) => {
 *   return <div>{formatAddress(address)}</div>;
 * });
 * ```
 *
 * 2️⃣ 预先格式化数据
 * ```ts
 * // ❌ 不好：每次渲染都格式化
 * {addresses.map(addr => <div>{formatAddress(addr)}</div>)}
 *
 * // ✅ 好：预处理数据
 * const formattedAddresses = useMemo(
 *   () => addresses.map(formatAddress),
 *   [addresses]
 * );
 * {formattedAddresses.map(addr => <div>{addr}</div>)}
 * ```
 */

/**
 * ⚠️ 注意事项
 *
 * 1. 此函数只做格式化显示，不验证地址合法性
 *    如需验证，请使用 web3.utils.isAddress() 等工具
 *
 * 2. 不同链的地址长度不同，建议根据链类型调整参数
 *    - 以太坊: 42 位，建议 prefix=6, suffix=4
 *    - Solana: 32-44 位，建议 prefix=8, suffix=6
 *
 * 3. 在做国际化时，省略符号可能需要本地化
 *    - 英文: '...'
 *    - 中文: '…'
 */
