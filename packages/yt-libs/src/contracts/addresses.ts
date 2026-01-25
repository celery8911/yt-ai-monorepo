/**
 * 智能合约地址配置
 *
 * 已部署到 Sepolia 测试网的合约地址
 */

export const CONTRACTS = {
	sepolia: {
		CBT: "0x502BccF9d143ecB89983EdFbf107ebDeD3B9a9fc" as const,
		Treasury: "0x80E3E5bEeCee6A1EE694e7CE8D34660a9C65EA1d" as const,
		Escrow: "0xd2a24326950A80272aCe018E2dcE25E22d5B5A7e" as const,
		DisputeDAO: "0x410756130fd06171298c72839FdCaB290Fe7eD16" as const,
		AgentHiring: "0xf54EEa283A05A5dD10944404D088c65bB60552dA" as const,
	},
} as const;

export const CHAIN_IDS = {
	sepolia: 11155111,
} as const;

export type ContractName = keyof typeof CONTRACTS.sepolia;
export type ChainName = keyof typeof CONTRACTS;
