import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { createConfig, createStorage } from "wagmi";
import { injected } from "wagmi/connectors";
import { http } from "viem";
import type { Chain } from "viem/chains";
import {
	mainnet,
	sepolia,
	arbitrumSepolia,
	baseSepolia,
	optimismSepolia,
	zkSyncSepoliaTestnet,
	polygonAmoy,
	bscTestnet,
} from "viem/chains";

export const defaultChains: readonly [Chain, ...Chain[]] = [
	sepolia,
	arbitrumSepolia,
	baseSepolia,
	optimismSepolia,
	zkSyncSepoliaTestnet,
	polygonAmoy,
	bscTestnet,
	mainnet,
];

export type CreateWalletConfigOptions = {
	appName: string;
	projectId: string;
	chains?: readonly [Chain, ...Chain[]];
};

export const createWalletConfig = ({
	appName,
	projectId,
	chains = defaultChains,
}: CreateWalletConfigOptions) => {
	const rpcOverrides: Record<number, string | undefined> = {
		[sepolia.id]: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL,
		[arbitrumSepolia.id]: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL,
		[baseSepolia.id]: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL,
		[optimismSepolia.id]: process.env.NEXT_PUBLIC_OP_SEPOLIA_RPC_URL,
	};

	const transports = chains.reduce(
		(acc, chain) => {
			const customRpc =
				typeof window !== "undefined" ? rpcOverrides[chain.id] : undefined;
			acc[chain.id] = http(customRpc);
			return acc;
		},
		{} as Record<number, ReturnType<typeof http>>,
	);

	const hasProjectId = Boolean(projectId) && projectId !== "demo";

	if (!hasProjectId) {
		return createConfig({
			chains,
			connectors: [injected()],
			ssr: true,
			transports,
			storage: createStorage({
				storage:
					typeof window !== "undefined" ? window.localStorage : undefined,
			}),
		});
	}

	return getDefaultConfig({
		appName,
		projectId,
		chains,
		ssr: true,
		transports,
	});
};
