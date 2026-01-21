"use client";

import type { ReactNode } from "react";
import { createWalletConfig, WalletProvider } from "@yt/hooks";
import { sepolia } from "viem/chains";

type Web3ProviderProps = {
	children: ReactNode;
};

const Web3Provider = ({ children }: Web3ProviderProps) => {
	const walletConfig = createWalletConfig({
		appName: "YT Agent Market",
		projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "demo",
		chains: [sepolia],
	});

	return (
		<WalletProvider config={walletConfig} enableRainbowKit={false}>
			{children}
		</WalletProvider>
	);
};

export default Web3Provider;
