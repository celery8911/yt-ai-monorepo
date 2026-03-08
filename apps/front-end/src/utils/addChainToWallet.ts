/**
 * 添加自定义网络到钱包 (EIP-3085 wallet_addEthereumChain)
 *
 * 面试要点 (W3: 如何添加自定义网络):
 * - 先调用 wallet_switchEthereumChain 尝试切换
 * - 如果返回 4902 错误（链不存在），再调用 wallet_addEthereumChain 添加
 * - 添加后需要再次调用 switch
 * - 需要提供完整参数: chainId, chainName, nativeCurrency, rpcUrls, blockExplorerUrls
 */

type ChainConfig = {
	chainId: string; // hex, e.g. "0x66eee"
	chainName: string;
	nativeCurrency: {
		name: string;
		symbol: string;
		decimals: number;
	};
	rpcUrls: string[];
	blockExplorerUrls: string[];
};

/** 支持的 L2 链配置 */
export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
	421614: {
		chainId: "0x66eee",
		chainName: "Arbitrum Sepolia",
		nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
		rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
		blockExplorerUrls: ["https://sepolia.arbiscan.io"],
	},
	84532: {
		chainId: "0x14a34",
		chainName: "Base Sepolia",
		nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
		rpcUrls: ["https://sepolia.base.org"],
		blockExplorerUrls: ["https://sepolia.basescan.org"],
	},
	11155420: {
		chainId: "0xaa37dc",
		chainName: "OP Sepolia",
		nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
		rpcUrls: ["https://sepolia.optimism.io"],
		blockExplorerUrls: ["https://sepolia-optimistic.etherscan.io"],
	},
	300: {
		chainId: "0x12c",
		chainName: "zkSync Sepolia",
		nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
		rpcUrls: ["https://sepolia.era.zksync.dev"],
		blockExplorerUrls: ["https://sepolia.explorer.zksync.io"],
	},
	80002: {
		chainId: "0x13882",
		chainName: "Polygon Amoy",
		nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
		rpcUrls: ["https://rpc-amoy.polygon.technology"],
		blockExplorerUrls: ["https://amoy.polygonscan.com"],
	},
	97: {
		chainId: "0x61",
		chainName: "BSC Testnet",
		nativeCurrency: { name: "BNB", symbol: "tBNB", decimals: 18 },
		rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545"],
		blockExplorerUrls: ["https://testnet.bscscan.com"],
	},
};

/**
 * 切换到指定链，如果钱包没有该链则自动添加
 *
 * 流程: switch → 4902 错误 → add → switch again
 */
export async function switchOrAddChain(chainId: number): Promise<boolean> {
	if (typeof window === "undefined" || !window.ethereum) return false;

	const hexChainId = `0x${chainId.toString(16)}`;

	try {
		// Step 1: 尝试切换
		await window.ethereum.request({
			method: "wallet_switchEthereumChain",
			params: [{ chainId: hexChainId }],
		});
		return true;
	} catch (err: unknown) {
		// Step 2: 如果链不存在 (error code 4902)，添加它
		if (
			err &&
			typeof err === "object" &&
			"code" in err &&
			(err as { code: number }).code === 4902
		) {
			const config = CHAIN_CONFIGS[chainId];
			if (!config) {
				console.error(`No config found for chain ${chainId}`);
				return false;
			}

			try {
				await window.ethereum.request({
					method: "wallet_addEthereumChain",
					params: [config],
				});

				// Step 3: 添加后再次切换
				await window.ethereum.request({
					method: "wallet_switchEthereumChain",
					params: [{ chainId: hexChainId }],
				});
				return true;
			} catch {
				return false;
			}
		}

		return false;
	}
}
