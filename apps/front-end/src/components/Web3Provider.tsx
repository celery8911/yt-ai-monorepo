"use client";

import { ReactNode, useState, useMemo } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

type Web3ProviderProps = {
	children: ReactNode;
};

const Web3Provider = ({ children }: Web3ProviderProps) => {
	// Use state to create QueryClient only once per app life cycle
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 60 * 1000,
						refetchOnWindowFocus: false,
					},
				},
			}),
	);

	const config = useMemo(
		() =>
			getDefaultConfig({
				appName: "YT Agent Market",
				projectId: "demo",
				chains: [mainnet, sepolia],
				ssr: true,
			}),
		[],
	);

	return (
		<WagmiProvider config={config}>
			<QueryClientProvider client={queryClient}>
				<RainbowKitProvider>{children}</RainbowKitProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
};

export default Web3Provider;
