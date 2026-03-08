"use client";

import { useEffect } from "react";
import {
	type UseAccountReturnType,
	type UseBalanceReturnType,
	type UseConnectReturnType,
	type UseDisconnectReturnType,
	type Connector,
	useAccount,
	useBalance,
	useConnect,
	useDisconnect,
	useReconnect,
} from "wagmi";

// 🚀 Re-export all commonly used Wagmi Hooks
export {
	useAccount,
	useBalance,
	useConnect,
	useDisconnect,
	useChainId,
	useConfig,
	useSwitchChain,
	useSignMessage,
	useSignTypedData,
	useWriteContract,
	useReadContract,
	useReadContracts,
	useWaitForTransactionReceipt,
	usePublicClient,
	useReconnect,
} from "wagmi";

export type UseWalletReturn = {
	address: UseAccountReturnType["address"];
	isConnected: UseAccountReturnType["isConnected"];
	status: UseAccountReturnType["status"];
	balance: UseBalanceReturnType["data"];
	connectors: UseConnectReturnType["connectors"];
	connect: () => Promise<any>;
	connectWith: (connector: Connector) => Promise<any>;
	disconnect: () => Promise<any>;
	isConnecting: UseConnectReturnType["isPending"];
	error: UseConnectReturnType["error"];
};

type UseWalletOptions = {
	onAccountChanged?: (account: {
		address?: string;
		isConnected: boolean;
	}) => void;
	onChainChanged?: (chainId?: number) => void;
};

/**
 * useWallet - Unified aggregate wallet Hook (Production-ready wrapper)
 */
export const useWallet = (options?: UseWalletOptions): UseWalletReturn => {
	const { address, isConnected, status, chainId } = useAccount();
	const { connectors, connectAsync, error, isPending } = useConnect();
	const { disconnectAsync } = useDisconnect();
	const { reconnectAsync } = useReconnect();
	const { data: balance } = useBalance({
		address,
		query: {
			enabled: Boolean(address),
		},
	});

	// Auto-reconnect on mount
	useEffect(() => {
		reconnectAsync().catch(() => {});
	}, [reconnectAsync]);

	// Listen for chain changes
	useEffect(() => {
		if (chainId) {
			options?.onChainChanged?.(chainId);
		}
	}, [chainId, options]);

	/** Default connection logic */
	const connect = async () => {
		const connector = connectors[0];
		if (!connector) {
			throw new Error("No wallet connector available.");
		}
		return connectAsync({ connector });
	};

	/** Specific connector connection */
	const connectWith = async (connector: Connector) => {
		return connectAsync({ connector });
	};

	const disconnect = () => disconnectAsync();

	return {
		address,
		isConnected,
		status,
		balance,
		connectors,
		connect,
		connectWith,
		disconnect,
		isConnecting: isPending,
		error,
	};
};
