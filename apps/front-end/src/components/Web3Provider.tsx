"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const WalletProvider = dynamic(
	() => import("@yt/hooks").then((mod) => mod.WalletProvider),
	{
		ssr: false,
	},
);

type Web3ProviderProps = {
	children: ReactNode;
};

const Web3Provider = ({ children }: Web3ProviderProps) => {
	return (
		<WalletProvider
			appName="YT Agent Market"
			projectId={process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "demo"}
			enableRainbowKit={false}
		>
			{children}
		</WalletProvider>
	);
};

export default Web3Provider;
