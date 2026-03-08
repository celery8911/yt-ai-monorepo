/**
 * 智能合约地址配置
 *
 * 支持多链部署的合约地址映射
 */

/** 单条链上的合约地址集合 */
type ChainContracts = {
	readonly CBT: `0x${string}`;
	readonly Treasury: `0x${string}`;
	readonly Escrow: `0x${string}`;
	readonly DisputeDAO: `0x${string}`;
	readonly AgentHiring: `0x${string}`;
};

export const CONTRACTS: Record<string, ChainContracts> = {
	sepolia: {
		CBT: "0xac2eb74a857b3b6eb37809D2390AF425347046f4",
		Treasury: "0x5738aecFA9CEe06034c0d22E89aaf576EB570B74",
		Escrow: "0x910628E50bA74C6c6603d5B5032fFA93A8989f3b",
		DisputeDAO: "0x430BDF1B04A5E443adFE32B00D34b279c4E697eA",
		AgentHiring: "0xeC9b3a67fE5cfdE991a66AeeA6Cd0Ea969B4eb03",
	},
	arbitrumSepolia: {
		CBT: "0x0000000000000000000000000000000000000000",
		Treasury: "0x0000000000000000000000000000000000000000",
		Escrow: "0x0000000000000000000000000000000000000000",
		DisputeDAO: "0x0000000000000000000000000000000000000000",
		AgentHiring: "0x0000000000000000000000000000000000000000",
	},
	baseSepolia: {
		CBT: "0x0000000000000000000000000000000000000000",
		Treasury: "0x0000000000000000000000000000000000000000",
		Escrow: "0x0000000000000000000000000000000000000000",
		DisputeDAO: "0x0000000000000000000000000000000000000000",
		AgentHiring: "0x0000000000000000000000000000000000000000",
	},
	optimismSepolia: {
		CBT: "0x0000000000000000000000000000000000000000",
		Treasury: "0x0000000000000000000000000000000000000000",
		Escrow: "0x0000000000000000000000000000000000000000",
		DisputeDAO: "0x0000000000000000000000000000000000000000",
		AgentHiring: "0x0000000000000000000000000000000000000000",
	},
	zkSyncSepolia: {
		CBT: "0x0000000000000000000000000000000000000000",
		Treasury: "0x0000000000000000000000000000000000000000",
		Escrow: "0x0000000000000000000000000000000000000000",
		DisputeDAO: "0x0000000000000000000000000000000000000000",
		AgentHiring: "0x0000000000000000000000000000000000000000",
	},
	polygonAmoy: {
		CBT: "0x0000000000000000000000000000000000000000",
		Treasury: "0x0000000000000000000000000000000000000000",
		Escrow: "0x0000000000000000000000000000000000000000",
		DisputeDAO: "0x0000000000000000000000000000000000000000",
		AgentHiring: "0x0000000000000000000000000000000000000000",
	},
	bscTestnet: {
		CBT: "0x0000000000000000000000000000000000000000",
		Treasury: "0x0000000000000000000000000000000000000000",
		Escrow: "0x0000000000000000000000000000000000000000",
		DisputeDAO: "0x0000000000000000000000000000000000000000",
		AgentHiring: "0x0000000000000000000000000000000000000000",
	},
} as const;

export const CHAIN_IDS = {
	sepolia: 11155111,
	arbitrumSepolia: 421614,
	baseSepolia: 84532,
	optimismSepolia: 11155420,
	zkSyncSepolia: 300,
	polygonAmoy: 80002,
	bscTestnet: 97,
} as const;

/** chainId → 链名称映射 */
const CHAIN_ID_TO_NAME: Record<number, string> = Object.entries(
	CHAIN_IDS,
).reduce(
	(acc, [name, id]) => {
		acc[id] = name;
		return acc;
	},
	{} as Record<number, string>,
);

/**
 * 根据 chainId 获取对应链的合约地址
 * @param chainId 链 ID
 * @returns 合约地址集合，如果链不支持则返回 sepolia 的地址作为 fallback
 */
export function getContracts(chainId: number): ChainContracts {
	const chainName = CHAIN_ID_TO_NAME[chainId];
	if (chainName && CONTRACTS[chainName]) {
		return CONTRACTS[chainName];
	}
	return CONTRACTS.sepolia;
}

/** 支持的链信息 */
export type SupportedChainInfo = {
	name: string;
	chainId: number;
	type: "L1" | "Optimistic Rollup" | "ZK Rollup" | "Sidechain";
};

/** 获取所有支持的链信息列表 */
export function getSupportedChains(): SupportedChainInfo[] {
	return [
		{ name: "Sepolia", chainId: CHAIN_IDS.sepolia, type: "L1" },
		{
			name: "Arbitrum Sepolia",
			chainId: CHAIN_IDS.arbitrumSepolia,
			type: "Optimistic Rollup",
		},
		{
			name: "Base Sepolia",
			chainId: CHAIN_IDS.baseSepolia,
			type: "Optimistic Rollup",
		},
		{
			name: "OP Sepolia",
			chainId: CHAIN_IDS.optimismSepolia,
			type: "Optimistic Rollup",
		},
		{
			name: "zkSync Sepolia",
			chainId: CHAIN_IDS.zkSyncSepolia,
			type: "ZK Rollup",
		},
		{
			name: "Polygon Amoy",
			chainId: CHAIN_IDS.polygonAmoy,
			type: "Sidechain",
		},
		{ name: "BSC Testnet", chainId: CHAIN_IDS.bscTestnet, type: "Sidechain" },
	];
}

export type ContractName = keyof ChainContracts;
export type ChainName = keyof typeof CONTRACTS;
