/**
 * 智能合约地址配置
 *
 * 已部署到 Sepolia 测试网的合约地址
 */

export const CONTRACTS = {
	sepolia: {
		CBT: "0x502BccF9d143ecB89983EdFbf107ebDeD3B9a9fc" as const,
		Treasury: "0x80E3E5bEeCee6A1EE694e7CE8D34660a9C65EA1d" as const,
		Escrow: "0xfdCC19d2CA9a6b6A7151082Fac9d7337D7010351" as const,
		DisputeDAO: "0xe0132Ef13B63223345039E910b5080B1CaaA54DE" as const,
		AgentHiring: "0xc803C3cd728eb419a00a79660DA9377cb1c54BbA" as const,
	},
} as const;

export const CHAIN_IDS = {
	sepolia: 11155111,
} as const;

export type ContractName = keyof typeof CONTRACTS.sepolia;
export type ChainName = keyof typeof CONTRACTS;
