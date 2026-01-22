import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { http } from "viem";
import type { Chain } from "viem/chains";
import { mainnet, sepolia } from "viem/chains";

export const defaultChains: readonly [Chain, ...Chain[]] = [mainnet, sepolia];

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
	const transports = chains.reduce(
		(acc, chain) => {
			// 使用 Sepolia RPC URL（如果有的话）
			if (chain.id === sepolia.id && typeof window !== "undefined") {
				const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
				acc[chain.id] = http(rpcUrl);
			} else {
				acc[chain.id] = http();
			}
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
