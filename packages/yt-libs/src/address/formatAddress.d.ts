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
export declare function formatAddress(
	address: string,
	options?: FormatAddressOptions,
): string;
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
