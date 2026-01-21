/**
 * 智能合约地址配置
 *
 * 已部署到 Sepolia 测试网的合约地址
 */

export const CONTRACTS = {
	sepolia: {
		CBT: "0x4b7a562e4d4b62Fa74018b6DdBb331409852b94F" as const,
		Treasury: "0xa9c51D9a1f13fc7Ba99c1904A279d9c9ab358a7A" as const,
		Escrow: "0xa660b131Ee89ACf18B162dF8AD76F981aC512288" as const,
		DisputeDAO: "0x40c2ec8a7845D67FeA7Cd8C214e4CCC7D563c5D2" as const,
	},
} as const;

export const CHAIN_IDS = {
	sepolia: 11155111,
} as const;

export type ContractName = keyof typeof CONTRACTS.sepolia;
export type ChainName = keyof typeof CONTRACTS;
