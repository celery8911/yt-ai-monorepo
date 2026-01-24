"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Card, CardContent, CardHeader } from "@yt/ui";
import { useWallet } from "@yt/hooks";
import { fetchDisputeDetail, voteDispute } from "@/apis/dao";

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
	const [isVoting, setIsVoting] = useState(false);
	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ["dao-dispute", id],
		queryFn: () => fetchDisputeDetail(String(id)),
		enabled: Boolean(id),
	});

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
		totalVotes > 0 ? Math.round((dispute!.votesFor / totalVotes) * 100) : 0;
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

	const handleVote = async (value: "approve" | "reject") => {
		if (!id || !address) return;
		setVoteError("");
		setIsVoting(true);
		try {
			await voteDispute({ disputeId: String(id), voter: address, vote: value });
			await refetch();
		} catch (err) {
			setVoteError(err instanceof Error ? err.message : "投票失败");
		} finally {
			setIsVoting(false);
		}
	};

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
									<p className="text-[10px] uppercase text-slate-500 font-bold">
										{voteHint}
									</p>
								</CardContent>
							</Card>

							{voteError ? (
								<p className="text-xs text-rose-400">{voteError}</p>
							) : null}
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
									disabled={!canVote || isVoting}
								>
									支持返还
								</Button>
								<Button
									className="w-full py-4 bg-purple-600 hover:bg-purple-500"
									onClick={() => handleVote("reject")}
									disabled={!canVote || isVoting}
								>
									支持释放
								</Button>
							</div>
						</div>
					</div>
				</>
			)}
		</div>
	);
};

export default DisputeDetail;
