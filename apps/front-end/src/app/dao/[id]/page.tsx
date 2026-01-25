"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Card, CardContent, CardHeader } from "@yt/ui";
import { useWallet } from "@yt/hooks";
import { fetchDisputeDetail, voteDispute } from "@/apis/dao";
import { useDisputeDAO } from "@/hooks/contracts/useDisputeDAO";
import { formatUnits } from "viem";
import { ethers } from "ethers";

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

const DisputeDetail = () => {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const { address, isConnected } = useWallet();
	const [voteError, setVoteError] = useState("");
	const [voteValue, setVoteValue] = useState<"approve" | "reject" | null>(null);
	const [needApprove, setNeedApprove] = useState(false);

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ["dao-dispute", id],
		queryFn: () => fetchDisputeDetail(String(id)),
		enabled: Boolean(id),
	});

	const {
		vote,
		isVotePending,
		isVoteConfirming,
		isVoteSuccess,
		voteError: contractVoteError,
		approveCBT,
		isApprovePending,
		isApproveConfirming,
		isApproveSuccess,
		approveError,
		voteCost,
		allowance,
	} = useDisputeDAO();

	const dispute = data?.dispute;
	const votes = data?.votes ?? [];
	const normalizedAddress = (address ?? "").toLowerCase();
	const isInitiator =
		Boolean(dispute?.initiator) &&
		normalizedAddress === dispute?.initiator?.toLowerCase();
	const isBuyer =
		Boolean(dispute?.buyer) &&
		normalizedAddress === dispute?.buyer?.toLowerCase();
	const isSeller =
		Boolean(dispute?.seller) &&
		normalizedAddress === dispute?.seller?.toLowerCase();
	const hasVoted = votes.some(
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

	const voteHint = useMemo(() => {
		if (!dispute) return "--";
		if (dispute.status === "RESOLVED") return "已完成裁决";
		return "投票进行中";
	}, [dispute]);

	// 检查是否需要 approve
	useEffect(() => {
		if (voteCost && allowance !== undefined) {
			setNeedApprove(BigInt(allowance) < BigInt(voteCost));
		}
	}, [voteCost, allowance]);

	// 当 approve 成功后自动发起投票
	useEffect(() => {
		const handleApproveSuccess = async () => {
			if (!dispute || !address || !voteValue) return;

			setVoteError("");
			const jobIdBytes32 = ethers.id(dispute.jobId);

			try {
				const supportEmployer = voteValue === "approve";
				await vote(jobIdBytes32, supportEmployer);
			} catch (err) {
				setVoteError(err instanceof Error ? err.message : "投票失败");
				setVoteValue(null);
			}
		};

		if (isApproveSuccess && voteValue && dispute) {
			handleApproveSuccess();
		}
	}, [isApproveSuccess, voteValue, dispute, address, vote]);

	// 当投票成功后,同步到后端
	useEffect(() => {
		if (isVoteSuccess && voteValue && address) {
			voteDispute({ disputeId: String(id), voter: address, vote: voteValue })
				.then(() => {
					refetch();
					setVoteValue(null);
				})
				.catch((err) => {
					setVoteError(
						`链上投票成功，但后端记录失败: ${err instanceof Error ? err.message : "未知错误"}`,
					);
				});
		}
	}, [isVoteSuccess, voteValue, address, id, refetch]);

	const handleVoteOnChain = async (value: "approve" | "reject") => {
		if (!dispute || !address) return;

		setVoteError("");
		const jobIdBytes32 = ethers.id(dispute.jobId);

		try {
			// supportEmployer: approve = true (支持雇主), reject = false (支持 agent)
			const supportEmployer = value === "approve";
			await vote(jobIdBytes32, supportEmployer);
		} catch (err) {
			setVoteError(err instanceof Error ? err.message : "投票失败");
			setVoteValue(null);
		}
	};

	const handleVote = async (value: "approve" | "reject") => {
		if (!id || !address || !dispute) return;

		setVoteError("");
		setVoteValue(value);

		// 检查是否需要 approve
		if (needApprove && voteCost) {
			try {
				await approveCBT(BigInt(voteCost));
				// approve 成功后会在 useEffect 中自动调用投票
			} catch (err) {
				setVoteError(err instanceof Error ? err.message : "授权失败");
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
		isVoteConfirming;

	const voteCostFormatted = voteCost ? formatUnits(BigInt(voteCost), 18) : "--";

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
						争议详情: 任务 #{dispute.jobId}
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
									<p className="text-[10px] uppercase text-slate-500 font-bold">
										{voteHint}
									</p>
								</CardContent>
							</Card>

							{(voteError || contractVoteError || approveError) && (
								<Card className="border-rose-500/20 bg-rose-500/5">
									<CardContent className="p-4">
										<p className="text-xs text-rose-400">
											{voteError ||
												contractVoteError?.message ||
												approveError?.message}
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
									{isApprovePending || isApproveConfirming
										? "授权中..."
										: isVotePending || isVoteConfirming
											? "投票中..."
											: needApprove
												? `授权并支持返还`
												: "支持返还"}
								</Button>
								<Button
									className="w-full py-4 bg-purple-600 hover:bg-purple-500"
									onClick={() => handleVote("reject")}
									disabled={!canVote || isProcessing}
								>
									{isApprovePending || isApproveConfirming
										? "授权中..."
										: isVotePending || isVoteConfirming
											? "投票中..."
											: needApprove
												? `授权并支持释放`
												: "支持释放"}
								</Button>
							</div>

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
