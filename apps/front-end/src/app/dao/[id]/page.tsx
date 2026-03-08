"use client";
import {
	useAccount,
	useChainId,
	useReadContract,
	useWaitForTransactionReceipt,
} from "@/hooks/web3";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Card, CardContent, CardHeader, useToast } from "@yt/ui";
import { fetchDisputeDetail } from "@/apis/dao";
import { useDisputeDAO } from "@/hooks/contracts/useDisputeDAO";
import { formatUnits } from "viem";
import { ethers } from "ethers";
import { getContracts, DisputeDAO_ABI } from "@yt/libs";

const resolveStatusVariant = (status?: string) => {
	if (status === "OPEN" || status === "VOTING") return "yellow";
	if (status === "RESOLVED") return "green";
	return "outline";
};

const formatDateTime = (value?: string) => {
	if (!value) return "--";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "--";
	return date.toLocaleString("zh-CN");
};

const normalizeBytes32 = (value?: string | null) => {
	if (!value) return null;
	const trimmed = value.trim();
	if (ethers.isHexString(trimmed, 32)) return trimmed;
	if (/^[0-9a-fA-F]{64}$/.test(trimmed)) return `0x${trimmed}`;
	return null;
};

const resolveDisputeBytes32 = (dispute?: {
	escrowId?: string | null;
	jobId?: string | null;
}) => {
	if (!dispute) return null;
	return (
		normalizeBytes32(dispute.escrowId ?? undefined) ??
		normalizeBytes32(dispute.jobId ?? undefined)
	);
};

const formatCountdown = (ms: number) => {
	if (ms <= 0) return "已结束";
	const totalSeconds = Math.floor(ms / 1000);
	const days = Math.floor(totalSeconds / 86400);
	const hours = Math.floor((totalSeconds % 86400) / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	const dayPart = days > 0 ? `${days}d ` : "";
	return `${dayPart}${hours}h ${minutes}m ${seconds}s`;
};

const DisputeDetail = () => {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const { address, isConnected } = useAccount();
	const chainId = useChainId();
	const contracts = getContracts(chainId);
	const { toast } = useToast();
	const [voteError, setVoteError] = useState("");
	const [voteValue, setVoteValue] = useState<"approve" | "reject" | null>(null);
	const [needApprove, setNeedApprove] = useState(false);
	const [votingPeriodHoursInput, setVotingPeriodHoursInput] = useState("");

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ["dao-dispute", id],
		queryFn: () => fetchDisputeDetail(String(id)),
		enabled: Boolean(id),
	});

	const {
		vote,
		voteHash,
		isVotePending,
		isVoteConfirming,
		isVoteSuccess,
		voteError: contractVoteError,
		approveCBT,
		isApprovePending,
		isApproveConfirming,
		isApproveSuccess,
		approveError,
		claimReward,
		isClaimPending,
		isClaimConfirming,
		isClaimSuccess,
		claimError,
		voteCost,
		allowance,
		keeper,
		resolveDispute,
		isResolvePending,
		isResolveConfirming,
		isResolveSuccess,
		resolveError,
		votingPeriod,
		minVoters,
		owner,
		setVotingPeriod,
		isSetVotingConfigPending,
		isSetVotingConfigConfirming,
		isSetVotingConfigSuccess,
		setVotingConfigError,
	} = useDisputeDAO();

	const dispute = data?.dispute;
	const votes = data?.votes ?? [];
	const disputeId = useMemo(() => resolveDisputeBytes32(dispute), [dispute]);
	const normalizedAddress = (address ?? "").toLowerCase();

	const { data: voterStatus } = useReadContract({
		address: contracts.DisputeDAO,
		abi: DisputeDAO_ABI.abi,
		functionName: "voterStatus",
		args: disputeId && address ? [disputeId, address] : undefined,
		query: {
			enabled: Boolean(disputeId && address),
		},
	});

	const [hasVotedOnchain, supportEmployerOnchain, hasClaimedOnchain] =
		(voterStatus as [boolean, boolean, boolean]) ?? [false, false, false];

	const isInitiator =
		Boolean(dispute?.initiator) &&
		normalizedAddress === dispute?.initiator?.toLowerCase();
	const isBuyer =
		Boolean(dispute?.buyer) &&
		normalizedAddress === dispute?.buyer?.toLowerCase();
	const isSeller =
		Boolean(dispute?.seller) &&
		normalizedAddress === dispute?.seller?.toLowerCase();
	const hasVoted =
		hasVotedOnchain ||
		votes.some(
			(vote) =>
				normalizedAddress && vote.voter.toLowerCase() === normalizedAddress,
		);
	const totalVotes = (dispute?.votesFor ?? 0) + (dispute?.votesAgainst ?? 0);
	const percentFor =
		totalVotes > 0 && dispute
			? Math.round((dispute.votesFor / totalVotes) * 100)
			: 0;
	const percentAgainst = totalVotes > 0 ? Math.max(0, 100 - percentFor) : 0;

	const canVote =
		Boolean(isConnected) &&
		!isInitiator &&
		!isBuyer &&
		!isSeller &&
		!hasVoted &&
		dispute?.status !== "RESOLVED";

	const isKeeper =
		Boolean(address && keeper) &&
		address?.toLowerCase() === String(keeper).toLowerCase();
	const isOwner =
		Boolean(address && owner) &&
		address?.toLowerCase() === String(owner).toLowerCase();

	const createdAtMs = dispute?.createdAt
		? new Date(dispute.createdAt).getTime()
		: null;
	const votingPeriodSeconds =
		votingPeriod !== undefined ? Number(votingPeriod) : null;
	const votingDeadlineMs =
		createdAtMs && votingPeriodSeconds
			? createdAtMs + votingPeriodSeconds * 1000
			: null;
	const remainingMs =
		votingDeadlineMs && dispute?.status !== "RESOLVED"
			? votingDeadlineMs - Date.now()
			: 0;
	const deadlineLabel = votingDeadlineMs
		? new Date(votingDeadlineMs).toLocaleString("zh-CN")
		: "--";
	const remainingLabel = votingDeadlineMs ? formatCountdown(remainingMs) : "--";

	const { data: disputeInfo } = useReadContract({
		address: contracts.DisputeDAO,
		abi: DisputeDAO_ABI.abi,
		functionName: "disputeInfo",
		args: disputeId ? [disputeId] : undefined,
		query: {
			enabled: Boolean(disputeId),
		},
	});

	const rewardPerWinner = useMemo(() => {
		if (!disputeInfo) return null;
		const result = disputeInfo as [
			string,
			bigint,
			bigint,
			bigint,
			number,
			boolean,
			bigint,
		];
		return result[6] ?? null;
	}, [disputeInfo]);

	const employerWins = dispute?.resolvedOutcome === "EMPLOYER";
	const isResolved = dispute?.status === "RESOLVED";
	const isWinner =
		Boolean(voterStatus) &&
		(supportEmployerOnchain ? employerWins : !employerWins);
	const hasReward = rewardPerWinner ? rewardPerWinner > 0n : false;
	const canClaimReward =
		Boolean(isConnected && disputeId) &&
		isResolved &&
		hasVotedOnchain &&
		isWinner &&
		!hasClaimedOnchain &&
		hasReward;
	const claimBlockedReason = useMemo(() => {
		if (!isConnected) return "请先连接钱包";
		if (!disputeId) return "缺少 escrowId";
		if (!isResolved) return "争议尚未结束";
		if (!hasVotedOnchain) return "你未参与投票";
		if (!isWinner) return "非胜方投票者";
		if (hasClaimedOnchain || isClaimSuccess) return "奖励已领取";
		if (!hasReward) return "当前没有可分配奖励";
		return "";
	}, [
		disputeId,
		hasClaimedOnchain,
		hasReward,
		hasVotedOnchain,
		isClaimSuccess,
		isConnected,
		isResolved,
		isWinner,
	]);

	const voteHint = useMemo(() => {
		if (!dispute) return "--";
		if (dispute.status === "RESOLVED") return "已完成裁决";
		return "投票进行中";
	}, [dispute]);

	// 检查是否需要 approve
	useEffect(() => {
		if (voteCost && allowance !== undefined) {
			setNeedApprove(BigInt(allowance as bigint) < BigInt(voteCost as bigint));
		}
	}, [voteCost, allowance]);

	// 当 approve 成功后自动发起投票
	useEffect(() => {
		const handleApproveSuccess = async () => {
			if (!dispute || !address || !voteValue) return;

			setVoteError("");
			const jobIdBytes32 =
				normalizeBytes32(dispute.escrowId) ?? normalizeBytes32(dispute.jobId);
			if (!jobIdBytes32) {
				setVoteError("争议缺少链上 escrowId，无法投票");
				setVoteValue(null);
				return;
			}

			try {
				const supportEmployer = voteValue === "approve";
				await vote(jobIdBytes32, supportEmployer);
			} catch (err) {
				setVoteError(err instanceof Error ? err.message : "投票失败");
				setVoteValue(null);
			}
		};

		if (isApproveSuccess && voteValue && dispute) {
			toast({
				message: "✅ CBT 授权成功！正在提交投票...",
				variant: "success",
				duration: 3000,
			});
			handleApproveSuccess();
		}
	}, [isApproveSuccess, voteValue, dispute, address, vote, toast]);

	// 当投票成功后,刷新链上数据并显示成功提示
	useEffect(() => {
		if (isVoteSuccess && voteValue && address) {
			toast({
				message: `✅ 投票成功！您已投票支持${voteValue === "approve" ? "返还" : "释放"}`,
				variant: "success",
				duration: 5000,
			});
			refetch();
			setVoteValue(null);
		}
	}, [isVoteSuccess, voteValue, address, refetch, toast]);

	// 当投票失败时显示错误提示（增强版：解析具体错误原因）
	useEffect(() => {
		if (contractVoteError) {
			const errorMessage =
				contractVoteError.message || String(contractVoteError);
			let userFriendlyMessage = "投票失败";

			// 解析常见的合约错误
			if (
				errorMessage.includes("ERC20: transfer amount exceeds balance") ||
				errorMessage.includes("insufficient balance") ||
				errorMessage.includes("transfer amount exceeds balance")
			) {
				userFriendlyMessage = "CBT 余额不足，无法支付投票费用（需要 100 CBT）";
			} else if (
				errorMessage.includes("ERC20: insufficient allowance") ||
				errorMessage.includes("insufficient allowance")
			) {
				userFriendlyMessage = "CBT 授权额度不足";
			} else if (errorMessage.includes("Already voted")) {
				userFriendlyMessage = "您已经投过票了";
			} else if (
				errorMessage.includes("Voting period ended") ||
				errorMessage.includes("Voting has ended")
			) {
				userFriendlyMessage = "投票期已结束";
			} else if (
				errorMessage.includes("User rejected") ||
				errorMessage.includes("user rejected")
			) {
				userFriendlyMessage = "您已取消交易";
			} else if (errorMessage.includes("gas")) {
				userFriendlyMessage = "Gas 费用不足或估算失败";
			} else {
				// 显示原始错误的简化版本
				const shortError = errorMessage.split("\n")[0];
				userFriendlyMessage =
					shortError.length > 80
						? `${shortError.substring(0, 80)}...`
						: shortError;
			}

			toast({
				message: `❌ ${userFriendlyMessage}`,
				variant: "error",
				duration: 6000,
			});
		}
	}, [contractVoteError, toast]);

	// 监听投票交易收据，检查是否真的成功
	const { data: voteReceipt, isError: isVoteReceiptError } =
		useWaitForTransactionReceipt({
			hash: voteHash,
		});

	useEffect(() => {
		// 优先使用 contractVoteError（如果有的话）
		if (contractVoteError) {
			return; // contractVoteError 的 useEffect 会处理
		}

		// 检查交易是否失败
		if (
			isVoteReceiptError ||
			(voteReceipt && voteReceipt.status === "reverted")
		) {
			// 由于无法直接从 receipt 获取 revert 原因，显示通用但有用的错误信息
			const errorMessage =
				"投票失败：可能是 CBT 余额不足（需要 100 CBT）、已投过票或投票期已结束";

			toast({
				message: `❌ ${errorMessage}`,
				variant: "error",
				duration: 6000,
			});
		}
	}, [isVoteReceiptError, voteReceipt, contractVoteError, toast]);

	// 当授权失败时显示错误提示
	useEffect(() => {
		if (approveError) {
			toast({
				message: `❌ CBT 授权失败：${approveError.message || "未知错误"}`,
				variant: "error",
				duration: 6000,
			});
		}
	}, [approveError, toast]);

	// 解析并优化错误信息
	const parseErrorMessage = (err: unknown): string => {
		if (!err) return "未知错误";

		const message = err instanceof Error ? err.message : String(err);

		// 检查常见错误模式
		if (message.includes("insufficient") || message.includes("balance")) {
			return "CBT 余额不足，请先获取足够的 CBT token";
		}
		if (message.includes("allowance")) {
			return "CBT 授权额度不足";
		}
		if (
			message.includes("User rejected") ||
			message.includes("user rejected")
		) {
			return "您已取消交易";
		}
		if (message.includes("gas")) {
			return "Gas 费用不足或估算失败";
		}

		return message;
	};

	const handleVoteOnChain = async (value: "approve" | "reject") => {
		if (!dispute || !address) return;

		setVoteError("");
		const jobIdBytes32 = resolveDisputeBytes32(dispute);
		if (!jobIdBytes32) {
			const errorMsg = "争议缺少链上 escrowId，无法投票";
			setVoteError(errorMsg);
			toast({
				message: `❌ ${errorMsg}`,
				variant: "error",
				duration: 5000,
			});
			setVoteValue(null);
			return;
		}

		try {
			// supportEmployer: approve = true (支持雇主), reject = false (支持 agent)
			const supportEmployer = value === "approve";
			await vote(jobIdBytes32, supportEmployer);
		} catch (err) {
			const errorMsg = parseErrorMessage(err);
			setVoteError(errorMsg);
			toast({
				message: `❌ 投票失败：${errorMsg}`,
				variant: "error",
				duration: 6000,
			});
			setVoteValue(null);
		}
	};

	const handleClaimReward = async () => {
		if (!disputeId) {
			setVoteError("争议缺少链上 escrowId，无法领取奖励");
			return;
		}
		try {
			await claimReward(disputeId);
		} catch (err) {
			setVoteError(err instanceof Error ? err.message : "领取奖励失败");
		}
	};

	const handleResolve = async () => {
		if (!dispute || !isKeeper) return;
		const jobIdBytes32 = resolveDisputeBytes32(dispute);
		if (!jobIdBytes32) {
			setVoteError("争议缺少链上 escrowId，无法结算");
			return;
		}
		try {
			await resolveDispute(jobIdBytes32);
		} catch (err) {
			setVoteError(err instanceof Error ? err.message : "结算失败");
		}
	};

	const handleSetVotingPeriod = async () => {
		if (!isOwner) return;
		const hours = Number(votingPeriodHoursInput);
		if (!Number.isFinite(hours) || hours <= 0) {
			setVoteError("投票期必须是正数小时");
			return;
		}
		try {
			await setVotingPeriod(BigInt(Math.floor(hours * 60 * 60)));
		} catch (err) {
			setVoteError(err instanceof Error ? err.message : "更新投票期失败");
		}
	};

	const handleVote = async (value: "approve" | "reject") => {
		if (!address) {
			toast({
				message: "❌ 请先连接钱包",
				variant: "error",
				duration: 4000,
			});
			return;
		}

		if (!id || !dispute) {
			toast({
				message: "❌ 争议数据加载失败，请刷新页面",
				variant: "error",
				duration: 4000,
			});
			return;
		}

		setVoteError("");
		setVoteValue(value);

		// 检查是否需要 approve
		if (needApprove && voteCost) {
			try {
				await approveCBT(BigInt(voteCost as bigint));
				// approve 成功后会在 useEffect 中自动调用投票
			} catch (err) {
				const errorMsg = err instanceof Error ? err.message : "授权失败";
				setVoteError(errorMsg);
				toast({
					message: `❌ CBT 授权失败：${errorMsg}`,
					variant: "error",
					duration: 6000,
				});
				setVoteValue(null);
			}
		} else {
			// 直接投票
			await handleVoteOnChain(value);
		}
	};

	const isProcessing =
		isApprovePending ||
		isApproveConfirming ||
		isVotePending ||
		isVoteConfirming ||
		isResolvePending ||
		isResolveConfirming ||
		isSetVotingConfigPending ||
		isSetVotingConfigConfirming;
	const isClaimInProgress = isClaimPending || isClaimConfirming;
	const isApproveInProgress = isApprovePending || isApproveConfirming;

	const voteCostFormatted = voteCost
		? formatUnits(BigInt(voteCost as bigint), 18)
		: "--";

	if (error) {
		return (
			<div className="max-w-4xl mx-auto space-y-8 pb-20">
				<Card className="border-rose-500/20 bg-rose-500/5">
					<CardContent className="p-6 text-rose-400 text-sm">
						争议详情加载失败。
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto space-y-8 pb-20">
			<Button
				variant="ghost"
				onClick={() => router.push("/dao")}
				className="text-slate-400 hover:text-blue-400 group mb-4"
			>
				<svg
					className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M10 19l-7-7m0 0l7-7m-7 7h18"
					/>
				</svg>
				返回治理列表
			</Button>

			{isLoading || !dispute ? (
				<Card className="border-white/5 bg-slate-900/30">
					<CardContent className="p-10 text-center text-slate-500 text-sm">
						{isLoading ? "正在加载争议详情..." : "未找到争议信息"}
					</CardContent>
				</Card>
			) : (
				<>
					<div className="flex justify-between items-center">
						<Badge variant={resolveStatusVariant(dispute.status)}>
							仲裁阶段: {dispute.status}
						</Badge>
						<span className="text-slate-500 font-mono text-xs">
							发起时间: {formatDateTime(dispute.createdAt)}
						</span>
					</div>

					<h1 className="text-4xl font-black tracking-tight">
						争议详情: {dispute.agentName ?? `任务 #${dispute.jobId}`}
					</h1>

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						<div className="lg:col-span-2 space-y-6">
							<Card>
								<CardHeader>
									<h3 className="font-black text-sm uppercase">争议说明</h3>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="p-4 bg-white/2 border border-white/5 rounded-xl">
										<h4 className="text-xs font-bold text-blue-400 uppercase mb-2">
											发起原因
										</h4>
										<p className="text-sm text-slate-300">
											{dispute.reason ?? "暂无争议说明。"}
										</p>
									</div>
									<div className="p-4 bg-white/2 border border-white/5 rounded-xl">
										<h4 className="text-xs font-bold text-purple-400 uppercase mb-2">
											投票记录
										</h4>
										{votes.length === 0 ? (
											<p className="text-sm text-slate-400">暂无投票记录。</p>
										) : (
											<div className="space-y-2 text-xs text-slate-300">
												{votes.map((vote) => (
													<div
														key={vote.id}
														className="flex items-center justify-between"
													>
														<span className="font-mono">{vote.voter}</span>
														<span className="uppercase">{vote.vote}</span>
														<span className="text-slate-500">
															{vote.weight}
														</span>
													</div>
												))}
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						</div>

						<div className="lg:col-span-1 space-y-6">
							<Card className="bg-blue-600/5">
								<CardHeader>
									<h3 className="font-black text-sm uppercase">当前投票分布</h3>
								</CardHeader>
								<CardContent className="space-y-6">
									<div className="space-y-2">
										<div className="flex justify-between text-xs font-bold">
											<span>支持返还 (approve)</span>
											<span>{percentFor}%</span>
										</div>
										<div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
											<div
												className="h-full bg-blue-500"
												style={{ width: `${percentFor}%` }}
											/>
										</div>
									</div>
									<div className="space-y-2">
										<div className="flex justify-between text-xs font-bold">
											<span>支持释放 (reject)</span>
											<span>{percentAgainst}%</span>
										</div>
										<div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
											<div
												className="h-full bg-purple-500"
												style={{ width: `${percentAgainst}%` }}
											/>
										</div>
									</div>
									<div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
										<p className="text-xs text-yellow-400">
											投票成本: {voteCostFormatted} CBT
										</p>
									</div>
									<div className="p-3 bg-white/2 border border-white/5 rounded-lg space-y-1">
										<p className="text-[10px] uppercase text-slate-500 font-bold">
											投票截止时间: {deadlineLabel}
										</p>
										<p className="text-xs text-slate-300">
											剩余时间: {remainingLabel}
										</p>
									</div>
									<p className="text-[10px] uppercase text-slate-500 font-bold">
										{voteHint}
									</p>
								</CardContent>
							</Card>

							{(voteError ||
								contractVoteError ||
								approveError ||
								claimError) && (
								<Card className="border-rose-500/20 bg-rose-500/5">
									<CardContent className="p-4">
										<p className="text-xs text-rose-400">
											{voteError ||
												contractVoteError?.message ||
												approveError?.message ||
												claimError?.message}
										</p>
									</CardContent>
								</Card>
							)}
							{setVotingConfigError && (
								<Card className="border-rose-500/20 bg-rose-500/5">
									<CardContent className="p-4">
										<p className="text-xs text-rose-400">
											{setVotingConfigError.message}
										</p>
									</CardContent>
								</Card>
							)}
							{resolveError && (
								<Card className="border-rose-500/20 bg-rose-500/5">
									<CardContent className="p-4">
										<p className="text-xs text-rose-400">
											{resolveError.message}
										</p>
									</CardContent>
								</Card>
							)}

							{!isConnected ? (
								<p className="text-xs text-slate-500">
									请先连接钱包再参与投票。
								</p>
							) : null}
							{isInitiator ? (
								<p className="text-xs text-slate-500">发起人不能参与投票。</p>
							) : null}
							{isBuyer || isSeller ? (
								<p className="text-xs text-slate-500">
									甲方或乙方不能参与投票。
								</p>
							) : null}
							{hasVoted ? (
								<p className="text-xs text-slate-500">
									你已投票，无法重复投票。
								</p>
							) : null}

							<div className="flex flex-col gap-3">
								<Button
									className="w-full py-4 bg-blue-600 hover:bg-blue-500"
									onClick={() => handleVote("approve")}
									disabled={!canVote || isProcessing}
								>
									{isProcessing && voteValue === "approve"
										? isApproveInProgress
											? "授权中..."
											: "投票中..."
										: needApprove
											? "授权并支持返还"
											: "支持返还"}
								</Button>
								<Button
									className="w-full py-4 bg-purple-600 hover:bg-purple-500"
									onClick={() => handleVote("reject")}
									disabled={!canVote || isProcessing}
								>
									{isProcessing && voteValue === "reject"
										? isApproveInProgress
											? "授权中..."
											: "投票中..."
										: needApprove
											? "授权并支持释放"
											: "支持释放"}
								</Button>

								{isKeeper ? (
									<Button
										variant="outline"
										className="w-full py-4"
										onClick={handleResolve}
										disabled={!dispute || isProcessing || isResolveSuccess}
									>
										{isResolvePending || isResolveConfirming
											? "结算中..."
											: isResolveSuccess
												? "已结算"
												: "结算争议"}
									</Button>
								) : null}
								<Button
									variant="outline"
									className="w-full py-4"
									onClick={handleClaimReward}
									disabled={!canClaimReward || isClaimInProgress}
								>
									{isClaimInProgress
										? "领取中..."
										: hasClaimedOnchain || isClaimSuccess
											? "已领取"
											: "领取奖励"}
								</Button>
								{!canClaimReward && claimBlockedReason ? (
									<p className="text-xs text-slate-500 text-center">
										不可领取原因: {claimBlockedReason}
									</p>
								) : null}
							</div>

							{isOwner ? (
								<Card className="border-white/5 bg-white/2">
									<CardContent className="p-4 space-y-3">
										<p className="text-xs uppercase text-slate-500 font-bold">
											调整投票期 (小时)
										</p>
										<input
											className="w-full rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm text-slate-100"
											placeholder={
												votingPeriod !== undefined
													? `${Number(votingPeriod) / 3600}`
													: "48"
											}
											value={votingPeriodHoursInput}
											onChange={(event) =>
												setVotingPeriodHoursInput(event.target.value)
											}
										/>
										<Button
											variant="outline"
											className="w-full"
											onClick={handleSetVotingPeriod}
											disabled={isProcessing}
										>
											{isSetVotingConfigPending || isSetVotingConfigConfirming
												? "更新中..."
												: isSetVotingConfigSuccess
													? "已更新"
													: "更新投票期"}
										</Button>
										<p className="text-[10px] text-slate-500">
											当前最小投票人数:{" "}
											{minVoters !== undefined ? String(minVoters) : "--"}
										</p>
									</CardContent>
								</Card>
							) : null}

							<p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
								投票将通过智能合约进行，需消耗 {voteCostFormatted} CBT
							</p>
						</div>
					</div>
				</>
			)}
		</div>
	);
};

export default DisputeDetail;
