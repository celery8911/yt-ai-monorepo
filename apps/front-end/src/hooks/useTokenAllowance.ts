"use client";
import {
	useChainId,
	useWriteContract,
	useReadContracts,
	useWaitForTransactionReceipt,
	useWallet,
} from "@/hooks/web3";

/**
 * useTokenAllowance Hook - Token 授权查询与撤销
 *
 * 面试要点 (W6/W9: Token 授权管理 / 防钓鱼安全):
 * - approve(spender, MaxUint256) 无限授权的风险：合约被攻击后可转走所有已授权 Token
 * - 最佳实践：按需授权（只授权本次交易所需金额）
 * - 撤销授权：调用 approve(spender, 0) 将授权额度归零
 * - 用户应定期检查并撤销不必要的授权（类似 revoke.cash）
 */

import { useCallback } from "react";
import { getContracts, CBT_ABI } from "@yt/libs";
import type { Abi } from "viem";
import { formatUnits } from "viem";

type AllowanceInfo = {
	spenderName: string;
	spenderAddress: `0x${string}`;
	allowance: bigint;
	formatted: string;
	isUnlimited: boolean;
};

const UNLIMITED_THRESHOLD = 2n ** 128n; // 大于此值视为无限授权

type SpenderInfo = {
	name: string;
	address: `0x${string}`;
};

export function useTokenAllowance(spenderList?: SpenderInfo[]) {
	const { address } = useWallet();
	const chainId = useChainId();
	const contracts = getContracts(chainId);

	const {
		writeContract: revokeApproval,
		data: revokeHash,
		isPending: isRevoking,
	} = useWriteContract();

	const { isLoading: isRevokeConfirming, isSuccess: isRevokeSuccess } =
		useWaitForTransactionReceipt({ hash: revokeHash });

	// 使用传入的 spenderList 或默认值
	const spenders: SpenderInfo[] = spenderList ?? [
		{ name: "AgentHiring", address: contracts.AgentHiring },
		{ name: "Escrow", address: contracts.Escrow },
		{ name: "DisputeDAO", address: contracts.DisputeDAO },
	];

	const { data: rawAllowances, refetch: refetchAllowances } = useReadContracts({
		contracts: spenders.map((spender) => ({
			address: contracts.CBT,
			abi: CBT_ABI.abi as Abi,
			functionName: "allowance",
			args: [address, spender.address],
		})),
		query: {
			enabled: !!address,
		},
	});

	// 格式化授权数据
	const allowances: AllowanceInfo[] = spenders.map((spender, i) => {
		const raw = (rawAllowances?.[i]?.result as bigint) ?? 0n;
		const isUnlimited = raw >= UNLIMITED_THRESHOLD;

		return {
			spenderName: spender.name,
			spenderAddress: spender.address,
			allowance: raw,
			formatted: isUnlimited
				? "无限"
				: `${Number(formatUnits(raw, 18)).toFixed(2)} CBT`,
			isUnlimited,
		};
	});

	/**
	 * 撤销授权 — approve(spender, 0)
	 */
	const revokeAllowance = useCallback(
		(spenderAddress: `0x${string}`) => {
			revokeApproval({
				address: contracts.CBT,
				abi: CBT_ABI.abi,
				functionName: "approve",
				args: [spenderAddress, 0n],
			});
		},
		[contracts.CBT, revokeApproval],
	);

	return {
		allowances,
		allowanceList: allowances,
		revokeAllowance,
		revoke: revokeAllowance,
		isRevoking,
		isRevokeConfirming,
		isRevokeSuccess,
		refetchAllowances,
	};
}
