"use client";

/**
 * useNativeProvider Hook - EIP-1193 原生 Provider 连接示例
 *
 * 仅作面试展示用，演示不依赖 wagmi 的底层钱包交互。
 * 实际业务代码仍使用 wagmi。
 *
 * 面试要点 (W1: 钱包连接流程 / EIP-1193 Provider 原理):
 * - EIP-1193 定义了 Provider 的统一接口: request({ method, params })
 * - 所有钱包 (MetaMask, Coinbase, etc.) 都实现了这个接口
 * - wagmi / ethers.js / web3.js 都是对 EIP-1193 Provider 的封装
 * - 核心方法: eth_requestAccounts, eth_chainId, personal_sign
 * - 核心事件: accountsChanged, chainChanged, disconnect
 */

import { useState, useEffect, useCallback } from "react";

type NativeProviderState = {
	isConnected: boolean;
	address: string | null;
	chainId: string | null;
	error: string | null;
};

export function useNativeProvider() {
	const [state, setState] = useState<NativeProviderState>({
		isConnected: false,
		address: null,
		chainId: null,
		error: null,
	});

	const getProvider = useCallback(() => {
		if (typeof window !== "undefined" && window.ethereum) {
			return window.ethereum;
		}
		return null;
	}, []);

	/**
	 * 连接钱包 - 使用 eth_requestAccounts
	 *
	 * 底层调用: provider.request({ method: 'eth_requestAccounts' })
	 * MetaMask 会弹窗让用户选择要连接的账户
	 */
	const connect = useCallback(async () => {
		const provider = getProvider();
		if (!provider) {
			setState((prev) => ({ ...prev, error: "未检测到以太坊钱包" }));
			return;
		}

		try {
			// 请求用户授权连接
			const accounts = (await provider.request({
				method: "eth_requestAccounts",
			})) as string[];

			// 获取当前链 ID
			const chainId = (await provider.request({
				method: "eth_chainId",
			})) as string;

			setState({
				isConnected: true,
				address: accounts[0] || null,
				chainId,
				error: null,
			});
		} catch (err) {
			setState((prev) => ({
				...prev,
				error: err instanceof Error ? err.message : "连接失败",
			}));
		}
	}, [getProvider]);

	/**
	 * 签名消息 - 使用 personal_sign
	 */
	const signMessage = useCallback(
		async (message: string): Promise<string | null> => {
			const provider = getProvider();
			if (!provider || !state.address) return null;

			try {
				const signature = (await provider.request({
					method: "personal_sign",
					params: [message, state.address],
				})) as string;

				return signature;
			} catch {
				return null;
			}
		},
		[state.address, getProvider],
	);

	/**
	 * 切换链 - 使用 wallet_switchEthereumChain
	 */
	const switchChain = useCallback(
		async (chainIdHex: string) => {
			const provider = getProvider();
			if (!provider) return;

			try {
				await provider.request({
					method: "wallet_switchEthereumChain",
					params: [{ chainId: chainIdHex }],
				});
			} catch (err: unknown) {
				// 4902: 链不存在，需要先添加
				if (
					err &&
					typeof err === "object" &&
					"code" in err &&
					(err as { code: number }).code === 4902
				) {
					setState((prev) => ({
						...prev,
						error: "该网络未添加到钱包，请先添加",
					}));
				}
			}
		},
		[getProvider],
	);

	/**
	 * 监听钱包事件 - EIP-1193 标准事件
	 *
	 * 面试要点:
	 * - accountsChanged: 用户切换账户，可能返回空数组(断开连接)
	 * - chainChanged: 用户切换网络，返回 hex 格式的 chainId
	 * - disconnect: Provider 断开连接 (注意：MetaMask 很少触发此事件)
	 */
	useEffect(() => {
		const provider = getProvider();
		if (!provider) return;

		const handleAccountsChanged = (accounts: string[]) => {
			if (accounts.length === 0) {
				// 空数组 = 断开连接
				setState({
					isConnected: false,
					address: null,
					chainId: null,
					error: null,
				});
			} else {
				setState((prev) => ({
					...prev,
					isConnected: true,
					address: accounts[0],
				}));
			}
		};

		const handleChainChanged = (chainId: string) => {
			// chainChanged 返回 hex 格式，如 "0xaa36a7" (Sepolia)
			setState((prev) => ({ ...prev, chainId }));
		};

		const handleDisconnect = () => {
			setState({
				isConnected: false,
				address: null,
				chainId: null,
				error: null,
			});
		};

		provider.on("accountsChanged", handleAccountsChanged);
		provider.on("chainChanged", handleChainChanged);
		provider.on("disconnect", handleDisconnect);

		return () => {
			provider.removeListener("accountsChanged", handleAccountsChanged);
			provider.removeListener("chainChanged", handleChainChanged);
			provider.removeListener("disconnect", handleDisconnect);
		};
	}, [getProvider]);

	return {
		...state,
		connect,
		signMessage,
		switchChain,
		hasProvider: typeof window !== "undefined" && !!window.ethereum,
	};
}
