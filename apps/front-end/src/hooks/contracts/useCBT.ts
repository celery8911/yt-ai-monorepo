"use client";
import {
	useChainId,
	useSwitchChain,
	useWriteContract,
	useReadContract,
	useWaitForTransactionReceipt,
	useWallet,
} from "@/hooks/web3";

/**
 * useCBT Hook - CBT 代币交互
 *
 * 功能：
 * - 查询 CBT 余额
 * - 购买 CBT (ETH -> CBT)
 * - 授权 CBT 给其他合约
 * - 查询兑换汇率
 */

import { parseEther, formatUnits } from "viem";
import { getContracts, CBT_ABI, CHAIN_IDS } from "@yt/libs";

export const useCBT = () => {
	const { address } = useWallet();
	const chainId = useChainId();
	const { switchChainAsync } = useSwitchChain();
	const contracts = getContracts(chainId);

	// 读取 CBT 余额
	const {
		data: balance,
		refetch: refetchBalance,
		isLoading: isLoadingBalance,
	} = useReadContract({
		address: contracts.CBT,
		abi: CBT_ABI.abi,
		functionName: "balanceOf",
		args: address ? [address] : undefined,
		query: {
			enabled: !!address,
		},
	});

	// 读取兑换汇率 (1 ETH = ? CBT)
	const { data: rate, isLoading: isLoadingRate } = useReadContract({
		address: contracts.CBT,
		abi: CBT_ABI.abi,
		functionName: "rate",
	});

	// 购买 CBT
	const {
		writeContract: buyCBT,
		data: buyHash,
		isPending: isBuyPending,
		error: buyError,
	} = useWriteContract();

	// 等待购买交易确认
	const { isLoading: isBuyConfirming, isSuccess: isBuySuccess } =
		useWaitForTransactionReceipt({
			hash: buyHash,
		});

	// 授权 CBT
	const {
		writeContract: approve,
		data: approveHash,
		isPending: isApprovePending,
		error: approveError,
	} = useWriteContract();

	// 等待授权交易确认
	const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } =
		useWaitForTransactionReceipt({
			hash: approveHash,
		});

	/**
	 * 购买 CBT
	 * @param ethAmount ETH 数量 (字符串，如 "0.1")
	 */
	const handleBuyCBT = async (ethAmount: string) => {
		if (!address) {
			throw new Error("请先连接钱包");
		}

		try {
			if (chainId !== CHAIN_IDS.sepolia) {
				await switchChainAsync({ chainId: CHAIN_IDS.sepolia });
			}
			buyCBT({
				address: contracts.CBT,
				abi: CBT_ABI.abi,
				functionName: "buyCBT",
				value: parseEther(ethAmount),
			});
		} catch (error) {
			console.error("购买 CBT 失败:", error);
			throw error;
		}
	};

	/**
	 * 授权 CBT
	 * @param spender 被授权地址
	 * @param amount 授权数量 (bigint)
	 */
	const handleApprove = async (spender: string, amount: bigint) => {
		if (!address) {
			throw new Error("请先连接钱包");
		}

		try {
			approve({
				address: contracts.CBT,
				abi: CBT_ABI.abi,
				functionName: "approve",
				args: [spender, amount],
			});
		} catch (error) {
			console.error("授权 CBT 失败:", error);
			throw error;
		}
	};

	/**
	 * 计算可获得的 CBT 数量
	 * @param ethAmount ETH 数量 (字符串)
	 * @returns CBT 数量 (bigint)
	 */
	const estimateCBT = (ethAmount: string): bigint | null => {
		if (!rate || !ethAmount) return null;
		try {
			const ethWei = parseEther(ethAmount);
			return ethWei * BigInt(rate as bigint);
		} catch {
			return null;
		}
	};

	/**
	 * 格式化 CBT 余额为可读字符串
	 * @param decimals 小数位数，默认 2
	 */
	const formatBalance = (decimals = 2): string => {
		if (!balance) return "0";
		const formatted = formatUnits(balance as bigint, 18);
		return Number.parseFloat(formatted).toFixed(decimals);
	};

	return {
		// 状态
		address,
		balance: balance as bigint | undefined,
		rate: rate as bigint | undefined,
		isLoadingBalance,
		isLoadingRate,

		// 购买相关
		buyCBT: handleBuyCBT,
		buyHash,
		isBuyPending,
		isBuyConfirming,
		isBuySuccess,
		buyError,

		// 授权相关
		approve: handleApprove,
		approveHash,
		isApprovePending,
		isApproveConfirming,
		isApproveSuccess,
		approveError,

		// 工具函数
		estimateCBT,
		formatBalance,
		refetchBalance,
	};
};
