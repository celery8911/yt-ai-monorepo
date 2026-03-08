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
	useAccountEffect,
} from "wagmi";

export type UseWalletReturn = {
	address: UseAccountReturnType["address"];
	isConnected: UseAccountReturnType["isConnected"];
	status: UseAccountReturnType["status"];
	balance: UseBalanceReturnType["data"];
	connectors: UseConnectReturnType["connectors"];
	connect: () => ReturnType<UseConnectReturnType["connectAsync"]>;
	connectWith: (
		connector: Connector,
	) => ReturnType<UseConnectReturnType["connectAsync"]>;
	disconnect: () => ReturnType<UseDisconnectReturnType["disconnectAsync"]>;
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
 * useWallet - 增强版钱包 Hook
 *
 * 新增功能:
 * - connectWith(connector): 指定钱包连接 (支持多钱包选择)
 * - 自动重连: 使用 useReconnect，页面刷新后自动恢复连接
 * - 账户变化监听: useAccountEffect 监听账户/连接状态变化
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

	// 自动重连: 组件 mount 时尝试恢复上次的连接
	useEffect(() => {
		reconnectAsync().catch(() => {
			// 重连失败是正常的（首次访问或 connector 不可用）
		});
	}, [reconnectAsync]);

	// 监听账户变化事件 (切换账户、连接、断开)
	useAccountEffect({
		onConnect: (data) => {
			options?.onAccountChanged?.({
				address: data.address,
				isConnected: true,
			});
			options?.onChainChanged?.(data.chainId);
		},
		onDisconnect: () => {
			options?.onAccountChanged?.({
				address: undefined,
				isConnected: false,
			});
		},
	});

	// 监听链切换
	useEffect(() => {
		if (chainId) {
			options?.onChainChanged?.(chainId);
		}
	}, [chainId, options]);

	/** 使用第一个可用的 connector 连接 */
	const connect = async () => {
		const connector = connectors[0];
		if (!connector) {
			throw new Error("No wallet connector available.");
		}
		return connectAsync({ connector });
	};

	/** 使用指定的 connector 连接 (多钱包选择) */
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
