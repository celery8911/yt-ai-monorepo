/**
 * 智能合约地址配置
 *
 * 已部署到 Sepolia 测试网的合约地址
 */

export const CONTRACTS = {
	sepolia: {
		CBT: "0xac2eb74a857b3b6eb37809D2390AF425347046f4" as const,
		Treasury: "0x5738aecFA9CEe06034c0d22E89aaf576EB570B74" as const,
		Escrow: "0x910628E50bA74C6c6603d5B5032fFA93A8989f3b" as const,
		DisputeDAO: "0x430BDF1B04A5E443adFE32B00D34b279c4E697eA" as const,
		AgentHiring: "0xeC9b3a67fE5cfdE991a66AeeA6Cd0Ea969B4eb03" as const,
	},
} as const;

export const CHAIN_IDS = {
	sepolia: 11155111,
} as const;

export type ContractName = keyof typeof CONTRACTS.sepolia;
export type ChainName = keyof typeof CONTRACTS;
