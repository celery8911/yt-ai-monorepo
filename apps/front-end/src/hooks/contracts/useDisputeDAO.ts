"use client";

/**
 * useDisputeDAO Hook - DisputeDAO 合约交互
 *
 * 功能：
 * - 发起争议 (openDispute)
 * - 投票 (vote)
 * - 查询争议状态
 * - 领取奖励 (claimReward)
 */

import {
	useChainId,
	useSwitchChain,
	useWriteContract,
	useWaitForTransactionReceipt,
	useReadContract,
} from "@yt/hooks";
import { CONTRACTS, DisputeDAO_ABI, CBT_ABI, CHAIN_IDS } from "@yt/libs";
import { useWallet } from "@yt/hooks";
import { useCallback } from "react";

export const useDisputeDAO = () => {
	const { address } = useWallet();
	const chainId = useChainId();
	const { switchChainAsync } = useSwitchChain();

	// 发起争议
	const {
		writeContract: openDispute,
		data: openDisputeHash,
		isPending: isOpenDisputePending,
		error: openDisputeError,
	} = useWriteContract();

	// 等待发起争议交易确认
	const {
		isLoading: isOpenDisputeConfirming,
		isSuccess: isOpenDisputeSuccess,
	} = useWaitForTransactionReceipt({
		hash: openDisputeHash,
	});

	// 投票
	const {
		writeContract: vote,
		data: voteHash,
		isPending: isVotePending,
		error: voteError,
	} = useWriteContract();

	// 等待投票交易确认
	const { isLoading: isVoteConfirming, isSuccess: isVoteSuccess } =
		useWaitForTransactionReceipt({
			hash: voteHash,
		});

	// Approve CBT for voting
	const {
		writeContract: approveCBT,
		data: approveHash,
		isPending: isApprovePending,
		error: approveError,
	} = useWriteContract();

	// 等待 approve 交易确认
	const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } =
		useWaitForTransactionReceipt({
			hash: approveHash,
		});

	// 领取奖励
	const {
		writeContract: claimReward,
		data: claimHash,
		isPending: isClaimPending,
		error: claimError,
	} = useWriteContract();

	// 等待领取奖励交易确认
	const { isLoading: isClaimConfirming, isSuccess: isClaimSuccess } =
		useWaitForTransactionReceipt({
			hash: claimHash,
		});

	// 读取投票成本
	const { data: voteCost } = useReadContract({
		address: CONTRACTS.sepolia.DisputeDAO,
		abi: DisputeDAO_ABI.abi,
		functionName: "voteCost",
	});

	// 读取 CBT allowance
	const { data: allowance, refetch: refetchAllowance } = useReadContract({
		address: CONTRACTS.sepolia.CBT,
		abi: CBT_ABI.abi,
		functionName: "allowance",
		args: address && [address, CONTRACTS.sepolia.DisputeDAO],
	});

	// 切换到 Sepolia 网络
	const ensureCorrectNetwork = useCallback(async () => {
		if (chainId !== CHAIN_IDS.sepolia) {
			await switchChainAsync({ chainId: CHAIN_IDS.sepolia });
		}
	}, [chainId, switchChainAsync]);

	// 发起争议操作
	const handleOpenDispute = useCallback(
		async (jobId: string, reason: number) => {
			await ensureCorrectNetwork();
			return openDispute({
				address: CONTRACTS.sepolia.DisputeDAO,
				abi: DisputeDAO_ABI.abi,
				functionName: "openDispute",
				args: [jobId as `0x${string}`, reason],
			});
		},
		[ensureCorrectNetwork, openDispute],
	);

	// Approve CBT 操作
	const handleApproveCBT = useCallback(
		async (amount: bigint) => {
			await ensureCorrectNetwork();
			return approveCBT({
				address: CONTRACTS.sepolia.CBT,
				abi: CBT_ABI.abi,
				functionName: "approve",
				args: [CONTRACTS.sepolia.DisputeDAO, amount],
			});
		},
		[ensureCorrectNetwork, approveCBT],
	);

	// 投票操作
	const handleVote = useCallback(
		async (jobId: string, supportEmployer: boolean) => {
			await ensureCorrectNetwork();
			return vote({
				address: CONTRACTS.sepolia.DisputeDAO,
				abi: DisputeDAO_ABI.abi,
				functionName: "vote",
				args: [jobId as `0x${string}`, supportEmployer],
			});
		},
		[ensureCorrectNetwork, vote],
	);

	// 领取奖励操作
	const handleClaimReward = useCallback(
		async (jobId: string) => {
			await ensureCorrectNetwork();
			return claimReward({
				address: CONTRACTS.sepolia.DisputeDAO,
				abi: DisputeDAO_ABI.abi,
				functionName: "claimReward",
				args: [jobId as `0x${string}`],
			});
		},
		[ensureCorrectNetwork, claimReward],
	);

	return {
		// 发起争议
		openDispute: handleOpenDispute,
		openDisputeHash,
		isOpenDisputePending,
		isOpenDisputeConfirming,
		isOpenDisputeSuccess,
		openDisputeError,

		// Approve CBT
		approveCBT: handleApproveCBT,
		approveHash,
		isApprovePending,
		isApproveConfirming,
		isApproveSuccess,
		approveError,

		// 投票
		vote: handleVote,
		voteHash,
		isVotePending,
		isVoteConfirming,
		isVoteSuccess,
		voteError,

		// 领取奖励
		claimReward: handleClaimReward,
		claimHash,
		isClaimPending,
		isClaimConfirming,
		isClaimSuccess,
		claimError,

		// 读取数据
		voteCost,
		allowance,
		refetchAllowance,
	};
};
