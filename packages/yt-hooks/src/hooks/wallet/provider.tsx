"use client";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	type ComponentType,
	type ReactNode,
	useEffect,
	useMemo,
	useState,
} from "react";
import { WagmiProvider, type Config } from "wagmi";

import { createWalletConfig, defaultChains } from "./config";

type RainbowKitProviderType = ComponentType<{ children: ReactNode }>;

export type WalletProviderProps = {
	children: ReactNode;
	config?: Config;
	appName?: string;
	projectId?: string;
	enableRainbowKit?: boolean;
};

export const WalletProvider = ({
	children,
	config,
	appName = "YT Agent Market",
	projectId = "demo",
	enableRainbowKit = false,
}: WalletProviderProps) => {
	const [queryClient] = useState(() => new QueryClient());
	const [RainbowKitProvider, setRainbowKitProvider] =
		useState<RainbowKitProviderType | null>(null);
	const wagmiConfig = useMemo(
		() =>
			config ??
			createWalletConfig({
				appName,
				projectId,
				chains: defaultChains,
			}),
		[config, appName, projectId],
	);

	useEffect(() => {
		if (!enableRainbowKit) {
			setRainbowKitProvider(null);
			return;
		}

		let mounted = true;
		void import("@rainbow-me/rainbowkit").then((mod) => {
			if (mounted) {
				setRainbowKitProvider(() => mod.RainbowKitProvider);
			}
		});

		return () => {
			mounted = false;
		};
	}, [enableRainbowKit]);

	const content =
		enableRainbowKit && RainbowKitProvider ? (
			<RainbowKitProvider>{children}</RainbowKitProvider>
		) : (
			<>{children}</>
		);

	return (
		<WagmiProvider config={wagmiConfig}>
			<QueryClientProvider client={queryClient}>{content}</QueryClientProvider>
		</WagmiProvider>
	);
};
