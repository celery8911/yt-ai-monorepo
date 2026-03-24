"use client";
import {
	useChainId,
	useSwitchChain,
	useWriteContract,
	useReadContract,
	useWaitForTransactionReceipt,
	useWallet,
} from "@/hooks/web3";
import type { Abi } from "viem";

/**
 * useDisputeDAO Hook - DisputeDAO 合约交互
 *
 * 功能：
 * - 发起争议 (openDispute)
 * - 投票 (vote)
 * - 查询争议状态
 * - 领取奖励 (claimReward)
 */

import { getContracts, DisputeDAO_ABI, CBT_ABI, CHAIN_IDS } from "@yt/libs";
import { useCallback } from "react";
import { useGasEstimate } from "../useGasEstimate";

export const useDisputeDAO = () => {
	const { address } = useWallet();
	const chainId = useChainId();
	const { switchChainAsync } = useSwitchChain();
	const contracts = getContracts(chainId);
	const { estimateContractGas } = useGasEstimate();

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

	// 结算争议
	const {
		writeContract: resolveDispute,
		data: resolveHash,
		isPending: isResolvePending,
		error: resolveError,
	} = useWriteContract();

	// 更新投票配置
	const {
		writeContract: setVotingConfig,
		data: setVotingConfigHash,
		isPending: isSetVotingConfigPending,
		error: setVotingConfigError,
	} = useWriteContract();

	// 等待结算交易确认
	const { isLoading: isResolveConfirming, isSuccess: isResolveSuccess } =
		useWaitForTransactionReceipt({
			hash: resolveHash,
		});

	// 等待投票配置更新确认
	const {
		isLoading: isSetVotingConfigConfirming,
		isSuccess: isSetVotingConfigSuccess,
	} = useWaitForTransactionReceipt({
		hash: setVotingConfigHash,
	});

	// 等待领取奖励交易确认
	const { isLoading: isClaimConfirming, isSuccess: isClaimSuccess } =
		useWaitForTransactionReceipt({
			hash: claimHash,
		});

	// 读取投票成本
	const { data: voteCost } = useReadContract({
		address: contracts.DisputeDAO,
		abi: DisputeDAO_ABI.abi as Abi,
		functionName: "voteCost",
	});

	// 读取投票周期
	const { data: votingPeriod } = useReadContract({
		address: contracts.DisputeDAO,
		abi: DisputeDAO_ABI.abi as Abi,
		functionName: "votingPeriod",
	});

	// 读取最小投票人数
	const { data: minVoters } = useReadContract({
		address: contracts.DisputeDAO,
		abi: DisputeDAO_ABI.abi as Abi,
		functionName: "minVoters",
	});

	// 读取 keeper
	const { data: keeper } = useReadContract({
		address: contracts.DisputeDAO,
		abi: DisputeDAO_ABI.abi as Abi,
		functionName: "keeper",
	});

	// 读取 owner
	const { data: owner } = useReadContract({
		address: contracts.DisputeDAO,
		abi: DisputeDAO_ABI.abi as Abi,
		functionName: "owner",
	});

	// 读取 CBT allowance
	const { data: allowance, refetch: refetchAllowance } = useReadContract({
		address: contracts.CBT,
		abi: CBT_ABI.abi as Abi,
		functionName: "allowance",
		args: address && [address, contracts.DisputeDAO],
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
			const est = await estimateContractGas({
				address: contracts.DisputeDAO,
				abi: DisputeDAO_ABI.abi as Abi,
				functionName: "openDispute",
				args: [jobId as `0x${string}`, reason],
				account: address,
			});

			return openDispute({
				address: contracts.DisputeDAO,
				abi: DisputeDAO_ABI.abi as Abi,
				functionName: "openDispute",
				args: [jobId as `0x${string}`, reason],
				gas: est?.gasLimit,
			});
		},
		[
			ensureCorrectNetwork,
			openDispute,
			contracts.DisputeDAO,
			estimateContractGas,
			address,
		],
	);

	// Approve CBT 操作
	const handleApproveCBT = useCallback(
		async (amount: bigint) => {
			await ensureCorrectNetwork();
			return approveCBT({
				address: contracts.CBT,
				abi: CBT_ABI.abi as Abi,
				functionName: "approve",
				args: [contracts.DisputeDAO, amount],
			});
		},
		[ensureCorrectNetwork, approveCBT, contracts.CBT, contracts.DisputeDAO],
	);

	// 投票操作
	const handleVote = useCallback(
		async (jobId: string, supportEmployer: boolean) => {
			await ensureCorrectNetwork();
			const est = await estimateContractGas({
				address: contracts.DisputeDAO,
				abi: DisputeDAO_ABI.abi as Abi,
				functionName: "vote",
				args: [jobId as `0x${string}`, supportEmployer],
				account: address,
			});

			return vote({
				address: contracts.DisputeDAO,
				abi: DisputeDAO_ABI.abi as Abi,
				functionName: "vote",
				args: [jobId as `0x${string}`, supportEmployer],
				gas: est?.gasLimit,
			});
		},
		[
			ensureCorrectNetwork,
			vote,
			contracts.DisputeDAO,
			estimateContractGas,
			address,
		],
	);

	// 领取奖励操作
	const handleClaimReward = useCallback(
		async (jobId: string) => {
			await ensureCorrectNetwork();
			const est = await estimateContractGas({
				address: contracts.DisputeDAO,
				abi: DisputeDAO_ABI.abi as Abi,
				functionName: "claimReward",
				args: [jobId as `0x${string}`],
				account: address,
			});

			return claimReward({
				address: contracts.DisputeDAO,
				abi: DisputeDAO_ABI.abi as Abi,
				functionName: "claimReward",
				args: [jobId as `0x${string}`],
				gas: est?.gasLimit,
			});
		},
		[
			ensureCorrectNetwork,
			claimReward,
			contracts.DisputeDAO,
			estimateContractGas,
			address,
		],
	);

	// 结算争议操作
	const handleResolveDispute = useCallback(
		async (jobId: string) => {
			await ensureCorrectNetwork();
			return resolveDispute({
				address: contracts.DisputeDAO,
				abi: DisputeDAO_ABI.abi as Abi,
				functionName: "resolveDispute",
				args: [jobId as `0x${string}`],
			});
		},
		[ensureCorrectNetwork, resolveDispute, contracts.DisputeDAO],
	);

	// 更新投票周期操作
	const handleSetVotingPeriod = useCallback(
		async (periodSeconds: bigint) => {
			if (voteCost === undefined || minVoters === undefined) {
				throw new Error("Voting config not loaded");
			}
			await ensureCorrectNetwork();
			return setVotingConfig({
				address: contracts.DisputeDAO,
				abi: DisputeDAO_ABI.abi as Abi,
				functionName: "setVotingConfig",
				args: [
					BigInt(voteCost as bigint),
					periodSeconds,
					BigInt(minVoters as bigint),
				],
			});
		},
		[
			ensureCorrectNetwork,
			minVoters,
			setVotingConfig,
			voteCost,
			contracts.DisputeDAO,
		],
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

		// 结算争议
		resolveDispute: handleResolveDispute,
		resolveHash,
		isResolvePending,
		isResolveConfirming,
		isResolveSuccess,
		resolveError,

		// 更新投票配置
		setVotingPeriod: handleSetVotingPeriod,
		setVotingConfigHash,
		isSetVotingConfigPending,
		isSetVotingConfigConfirming,
		isSetVotingConfigSuccess,
		setVotingConfigError,

		// 读取数据
		voteCost,
		votingPeriod,
		minVoters,
		keeper,
		owner,
		allowance,
		refetchAllowance,
	};
};
