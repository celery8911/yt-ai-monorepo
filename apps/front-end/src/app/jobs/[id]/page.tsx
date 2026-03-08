"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
	useToast,
} from "@yt/ui";
import { useWallet } from "@yt/hooks";
import { CBT_ABI, CHAIN_IDS, getContracts, Escrow_ABI } from "@yt/libs";
import {
	fetchJobDetail,
	formatJobBudget,
	selectJobAgent,
	type MatchedAgent,
	type Job,
	type JobPriority,
	type JobStatus,
} from "@/apis/jobs";
import JobAgentOrbit from "@/app/jobs/_components/JobAgentOrbit";
import JobMatchSection from "@/app/jobs/_components/JobMatchSection";
import {
	useChainId,
	useReadContract,
	useSwitchChain,
	useWaitForTransactionReceipt,
	useWriteContract,
} from "@yt/hooks";
import { keccak256, parseUnits, stringToHex } from "viem";

const statusVariants: Record<JobStatus, "blue" | "purple" | "red" | "green"> = {
	DRAFT: "blue",
	OPEN: "green",
	MATCHING: "purple",
	IN_PROGRESS: "blue",
	SUBMITTED: "purple",
	REVIEWING: "blue",
	COMPLETED: "green",
	DISPUTED: "red",
	CANCELLED: "red",
	FAILED: "red",
};

const priorityVariants: Record<
	JobPriority,
	"blue" | "purple" | "red" | "green"
> = {
	LOW: "green",
	MEDIUM: "blue",
	HIGH: "purple",
	URGENT: "red",
};

const JobDetail = () => {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const [job, setJob] = useState<Job | null>(null);
	const [matches, setMatches] = useState<MatchedAgent[]>([]);
	const [selectedAgent, setSelectedAgent] = useState<MatchedAgent | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [matchStartSignal, setMatchStartSignal] = useState(0);
	const [subscribingAgentId, setSubscribingAgentId] = useState<string | null>(
		null,
	);
	const [escrowRequest, setEscrowRequest] = useState<{
		jobId: `0x${string}`;
		agentAddress: `0x${string}`;
		amount: bigint;
		agentId: string;
	} | null>(null);
	const { address, isConnected, connect } = useWallet();
	const { toast } = useToast();
	const chainId = useChainId();
	const contracts = getContracts(chainId);
	const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
	const {
		writeContract: approve,
		data: approveHash,
		isPending: isApprovePending,
		error: approveError,
	} = useWriteContract();
	const {
		writeContract: createEscrow,
		data: escrowHash,
		isPending: isEscrowPending,
		error: escrowError,
	} = useWriteContract();
	const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } =
		useWaitForTransactionReceipt({ hash: approveHash });
	const { isLoading: isEscrowConfirming, isSuccess: isEscrowSuccess } =
		useWaitForTransactionReceipt({ hash: escrowHash });
	const { data: serviceFeeBps } = useReadContract({
		address: contracts.Escrow,
		abi: Escrow_ABI.abi,
		functionName: "serviceFeeBps",
	});

	useEffect(() => {
		if (!id) return;
		const loadJob = async () => {
			setLoading(true);
			setError("");
			try {
				const data = await fetchJobDetail(id);
				setJob(data.job);
				setMatches(data.matches ?? []);
				setSelectedAgent(data.selectedAgent ?? null);
			} catch (loadError) {
				const message =
					loadError instanceof Error ? loadError.message : "请求失败";
				setError(message);
			} finally {
				setLoading(false);
			}
		};
		loadJob();
	}, [id]);

	const budgetLabel = useMemo(() => {
		if (!job) return "价格待定";
		return formatJobBudget(job);
	}, [job]);

	const deadlineLabel = useMemo(() => {
		if (!job?.deadlineAt) return "暂无";
		const parsed = new Date(job.deadlineAt);
		if (Number.isNaN(parsed.getTime())) return "暂无";
		return parsed.toLocaleDateString();
	}, [job]);

	const createdAtLabel = useMemo(() => {
		if (!job?.createdAt) return "暂无";
		const parsed = new Date(job.createdAt);
		if (Number.isNaN(parsed.getTime())) return "暂无";
		return parsed.toLocaleString();
	}, [job]);

	const paymentMethodLabel = useMemo(() => {
		switch (job?.paymentMethod) {
			case "FREE":
				return "免费";
			case "PER_TASK":
				return "按任务支付";
			case "HUMAN_HIRING":
				return "人工雇佣";
			case "RESULT_BASED":
				return "结果付费";
			default:
				return "未知";
		}
	}, [job?.paymentMethod]);

	const payoutStrategyLabel = useMemo(() => {
		switch (job?.payoutStrategy) {
			case "WINNER_TAKE_ALL":
				return "优胜者获得全部";
			case "SPLIT_IF_NO_SELECTION":
				return "未选中则拆分";
			default:
				return "未知";
		}
	}, [job?.payoutStrategy]);

	const showSelectedAgent =
		job?.status === "SUBMITTED" ||
		job?.status === "REVIEWING" ||
		job?.status === "COMPLETED";
	const showMatchError =
		job?.status === "FAILED" || job?.status === "CANCELLED";
	const showMatches = job?.status === "IN_PROGRESS";
	const isOwner = Boolean(
		address &&
			job?.createdBy &&
			address.toLowerCase() === job.createdBy.toLowerCase(),
	);

	const renderScore = (value?: number) => {
		if (value === undefined) return "—";
		return value.toFixed(2);
	};

	const formatAgentPrice = (
		agent: MatchedAgent,
		paymentMethod?: Job["paymentMethod"],
	): string => {
		let price: number | undefined;
		if (paymentMethod === "RESULT_BASED") {
			price = agent.resultBasedMinPrice;
		} else if (paymentMethod === "HUMAN_HIRING") {
			price = agent.minBid;
		} else if (paymentMethod === "PER_TASK") {
			price = agent.pricePerTask;
		}
		const fallback =
			agent.pricePerTask ?? agent.resultBasedMinPrice ?? agent.minBid;
		const resolved = price ?? fallback;
		if (resolved === undefined) return "—";
		return agent.currency ? `${resolved} ${agent.currency}` : `${resolved}`;
	};

	const parsePriceToCbt = (price?: string) => {
		if (!price) return null;
		const match = price.trim().match(/^(\d+(\.\d+)?)(?:\s*([A-Za-z]+))?$/);
		if (!match) return null;
		const value = match[1];
		const currency = match[3]?.toUpperCase();
		if (currency && currency !== "CBT") return null;
		return parseUnits(value, 18);
	};

	const buildEscrowJobId = (jobId: string, agentId: string) =>
		keccak256(stringToHex(`${jobId}-${agentId}`)) as `0x${string}`;

	const formatSubscribeError = useCallback((message?: string) => {
		if (!message) return "订阅失败，请稍后再试";
		const normalized = message.toLowerCase();
		if (
			normalized.includes("user rejected") ||
			normalized.includes("user denied") ||
			normalized.includes("rejected") ||
			normalized.includes("cancel")
		) {
			return "你已取消操作";
		}
		return "订阅失败，请稍后再试";
	}, []);

	const parseFeeBps = (value: unknown): bigint => {
		if (typeof value === "bigint") return value;
		if (typeof value === "number" && Number.isFinite(value)) {
			return BigInt(value);
		}
		if (typeof value === "string" && value !== "") return BigInt(value);
		return 0n;
	};

	const retryAgent =
		escrowRequest &&
		(matches.find((agent) => agent.id === escrowRequest.agentId) ??
			(selectedAgent?.id === escrowRequest.agentId ? selectedAgent : null));

	useEffect(() => {
		if (!escrowRequest || !isApproveSuccess || !address) return;

		createEscrow({
			address: contracts.Escrow,
			abi: Escrow_ABI.abi,
			functionName: "createEscrow",
			args: [
				escrowRequest.jobId,
				address,
				escrowRequest.agentAddress,
				escrowRequest.amount,
			],
		});
	}, [
		createEscrow,
		escrowRequest,
		isApproveSuccess,
		address,
		contracts.Escrow,
	]);

	useEffect(() => {
		if (!job || !escrowRequest || !isEscrowSuccess) return;

		const selectAgent = async () => {
			try {
				const response = await selectJobAgent(job.id, escrowRequest.agentId);
				setJob(response.job);
				const matched =
					matches.find((agent) => agent.id === escrowRequest.agentId) ??
					selectedAgent;
				setSelectedAgent(matched ?? null);
				setEscrowRequest(null);
				setSubscribingAgentId(null);
			} catch (selectError) {
				const message =
					selectError instanceof Error ? selectError.message : "选择智能体失败";
				toast({ message, variant: "error" });
				setSubscribingAgentId(null);
			}
		};

		selectAgent();
	}, [escrowRequest, isEscrowSuccess, job, matches, selectedAgent, toast]);

	useEffect(() => {
		if (!approveError && !escrowError) return;
		const message = formatSubscribeError(
			approveError?.message ?? escrowError?.message,
		);
		toast({ message, variant: "error" });
		setEscrowRequest(null);
		setSubscribingAgentId(null);
	}, [approveError, escrowError, formatSubscribeError, toast]);

	const handleSubscribe = async (agent: MatchedAgent) => {
		if (!job) return;

		try {
			setSubscribingAgentId(agent.id);
			if (!isConnected) {
				await connect();
			}

			if (
				escrowRequest &&
				isEscrowSuccess &&
				escrowRequest.agentId === agent.id
			) {
				const response = await selectJobAgent(job.id, agent.id);
				setJob(response.job);
				const matched =
					matches.find((item) => item.id === agent.id) ?? selectedAgent;
				setSelectedAgent(matched ?? null);
				setEscrowRequest(null);
				setSubscribingAgentId(null);
				return;
			}

			if (job.paymentMethod === "FREE") {
				const response = await selectJobAgent(job.id, agent.id);
				setJob(response.job);
				const matched =
					matches.find((item) => item.id === agent.id) ?? selectedAgent;
				setSelectedAgent(matched ?? null);
				setSubscribingAgentId(null);
				return;
			}

			if (!agent.owner) {
				toast({ message: "Agent 地址缺失，无法托管支付。", variant: "error" });
				setSubscribingAgentId(null);
				return;
			}

			const priceLabel = formatAgentPrice(agent, job.paymentMethod);
			const amount = parsePriceToCbt(priceLabel);
			if (!amount) {
				toast({
					message: "订阅费用非 CBT 计价或格式不正确。",
					variant: "error",
				});
				setSubscribingAgentId(null);
				return;
			}

			if (chainId !== CHAIN_IDS.sepolia) {
				await switchChainAsync({ chainId: CHAIN_IDS.sepolia });
			}

			const feeBps = parseFeeBps(serviceFeeBps);
			const fee = (amount * feeBps) / 10_000n;
			const approveAmount = amount + fee;

			setEscrowRequest({
				jobId: buildEscrowJobId(job.id, agent.id),
				agentAddress: agent.owner as `0x${string}`,
				amount,
				agentId: agent.id,
			});

			approve({
				address: contracts.CBT,
				abi: CBT_ABI.abi,
				functionName: "approve",
				args: [contracts.Escrow, approveAmount],
			});
		} catch (subscribeErr) {
			const message = formatSubscribeError(
				subscribeErr instanceof Error ? subscribeErr.message : undefined,
			);
			toast({ message, variant: "error" });
			setEscrowRequest(null);
			setSubscribingAgentId(null);
		}
	};

	const handleRunMatching = () => {
		if (!matches.length) {
			toast({ message: "暂无匹配结果可展示", variant: "info" });
			return;
		}
		setMatchStartSignal((prev) => prev + 1);
	};

	return (
		<div className="max-w-5xl mx-auto space-y-10 pb-20 relative">
			<div className="pointer-events-none absolute -top-24 right-[-12%] h-72 w-72 rounded-full bg-cyan-500/20 blur-[120px]" />
			<div className="pointer-events-none absolute top-40 left-[-10%] h-52 w-52 rounded-full bg-purple-500/20 blur-[110px]" />
			<div className="pointer-events-none absolute bottom-[-6%] right-[15%] h-44 w-44 rounded-full bg-blue-600/15 blur-[90px]" />
			<Button
				variant="ghost"
				onClick={() => router.push("/jobs")}
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
				返回列表
			</Button>

			{error ? (
				<Card className="border-rose-500/20 bg-rose-500/5">
					<CardContent className="p-6 text-rose-400 text-sm">
						{error}
					</CardContent>
				</Card>
			) : loading || !job ? (
				<Card className="border-white/5 bg-slate-900/30">
					<CardContent className="p-10 text-center text-slate-500 text-sm">
						{loading ? "正在加载任务详情..." : "未找到任务"}
					</CardContent>
				</Card>
			) : (
				<>
					<Card className="border-cyan-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/70 to-blue-950/60 shadow-[0_20px_70px_rgba(34,211,238,0.18)] backdrop-blur">
						<CardContent className="p-8 space-y-6">
							<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
								<div className="flex items-center gap-3">
									<Badge variant={priorityVariants[job.priority]}>
										{job.priority}
									</Badge>
									<Badge variant={statusVariants[job.status]}>
										{job.status}
									</Badge>
									{job.visibility ? (
										<Badge
											variant="outline"
											className="border-cyan-500/30 text-cyan-200"
										>
											{job.visibility.toUpperCase()}
										</Badge>
									) : null}
								</div>
								<div className="flex items-center gap-3">
									<span className="text-slate-500 font-mono text-xs">
										JOB_ID: {job.id}
									</span>
									{job.status === "DRAFT" ? (
										<Link href={`/jobs/${id}/edit`}>
											<Button size="sm" variant="outline">
												编辑任务
											</Button>
										</Link>
									) : null}
								</div>
							</div>

							<div className="space-y-5">
								<h1 className="text-4xl font-black tracking-tight text-white drop-shadow-[0_0_48px_rgba(59,130,246,0.75)] [text-shadow:0_0_18px_rgba(59,130,246,0.9)]">
									{job.title}
								</h1>
								<div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
									<div className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3">
										<p className="text-xs uppercase tracking-[0.2em] text-slate-500">
											发布人
										</p>
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<p className="mt-1 text-cyan-300 font-semibold max-w-[200px] truncate">
														{job.createdBy}
													</p>
												</TooltipTrigger>
												<TooltipContent>{job.createdBy}</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									</div>
									<div className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3">
										<p className="text-xs uppercase tracking-[0.2em] text-slate-500">
											分类
										</p>
										<p className="mt-1 text-white font-semibold">
											{job.category ?? "未分类"}
										</p>
									</div>
									<div className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3">
										<p className="text-xs uppercase tracking-[0.2em] text-slate-500">
											执行方
										</p>
										<p className="mt-1 text-purple-300 font-semibold">
											{job.selectedAgentId ?? "尚未选择"}
										</p>
									</div>
									<div className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3">
										<p className="text-xs uppercase tracking-[0.2em] text-slate-500">
											预算
										</p>
										<p className="mt-1 text-white font-black">{budgetLabel}</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="border-white/10 bg-gradient-to-r from-slate-950/70 via-slate-950/60 to-slate-950/70">
						<CardHeader>
							<h4 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">
								功能与结算
							</h4>
						</CardHeader>
						<CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
							<div className="flex items-center justify-between md:justify-start md:gap-4">
								<span className="text-slate-500">自动匹配</span>
								<span className="text-white font-semibold">
									{job.autoMatchEnabled ? "开启" : "关闭"}
								</span>
							</div>
							<div className="flex items-center justify-between md:justify-start md:gap-4">
								<span className="text-slate-500">竞价模式</span>
								<span className="text-white font-semibold">
									{job.biddingEnabled ? "开启" : "关闭"}
								</span>
							</div>
							<div className="flex items-center justify-between md:justify-start md:gap-4">
								<span className="text-slate-500">资金托管</span>
								<span className="text-white font-semibold">
									{job.escrowEnabled ? "开启" : "关闭"}
								</span>
							</div>
							<div className="flex items-center justify-between md:justify-start md:gap-4">
								<span className="text-slate-500">可见性</span>
								<span className="text-white font-semibold">
									{job.visibility}
								</span>
							</div>
							<div className="flex items-center justify-between md:justify-start md:gap-4">
								<span className="text-slate-500">验收期</span>
								<span className="text-white font-semibold">
									{job.reviewWindowDays} 天
								</span>
							</div>
							<div className="flex items-center justify-between md:justify-start md:gap-4">
								<span className="text-slate-500">结算策略</span>
								<span className="text-white font-semibold">
									{payoutStrategyLabel}
								</span>
							</div>
						</CardContent>
					</Card>

					<div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.85fr] gap-6">
						<div className="space-y-6">
							{isOwner && showMatches ? (
								<Card className="border-white/10 bg-gradient-to-br from-slate-950/70 via-slate-950/60 to-cyan-950/40">
									<CardHeader>
										<h4 className="font-black text-xs uppercase tracking-[0.2em] text-cyan-300">
											智能体匹配触发
										</h4>
									</CardHeader>
									<CardContent className="space-y-3 text-sm">
										<p className="text-slate-400">
											点击按钮后触发前端动画演示，从候选智能体中随机抽取 3
											个并并行调用智能体。
										</p>
										<Button
											variant="outline"
											disabled={matchStartSignal > 0}
											onClick={handleRunMatching}
											className="border-cyan-500/30 text-cyan-100"
										>
											{matchStartSignal > 0 ? "已触发匹配" : "开始匹配演示"}
										</Button>
									</CardContent>
								</Card>
							) : null}
							{isOwner && (matchStartSignal > 0 || matches.length > 0) ? (
								<JobAgentOrbit
									job={job}
									matches={matches}
									startSignal={matchStartSignal}
									onSubscribe={handleSubscribe}
									subscribingAgentId={subscribingAgentId}
								/>
							) : null}
							{escrowRequest && isEscrowSuccess && (
								<div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
									<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
										<span>
											托管已完成，但选择智能体还未确认，可点击重试完成选择。
										</span>
										<Button
											variant="outline"
											size="sm"
											disabled={
												!retryAgent || subscribingAgentId === retryAgent.id
											}
											onClick={() =>
												retryAgent && void handleSubscribe(retryAgent)
											}
											className="border-amber-400/50 text-amber-100 hover:bg-amber-400/10"
										>
											重试选择
										</Button>
									</div>
								</div>
							)}
							<JobMatchSection
								isOwner={isOwner}
								showMatchError={showMatchError}
								matchError={job.matchError}
								matches={matches}
								selectedAgent={selectedAgent}
								showSelectedAgent={showSelectedAgent}
								showMatches={false}
								jobPaymentMethod={job.paymentMethod}
								onSubscribe={handleSubscribe}
								subscribingAgentId={subscribingAgentId}
								isSwitching={isSwitching}
								isApprovePending={isApprovePending}
								isApproveConfirming={isApproveConfirming}
								isEscrowPending={isEscrowPending}
								isEscrowConfirming={isEscrowConfirming}
								renderScore={renderScore}
								formatAgentPrice={formatAgentPrice}
							/>

							<Card className="border-white/10 bg-gradient-to-br from-slate-950/70 via-slate-950/60 to-blue-950/50 shadow-[0_20px_50px_rgba(30,64,175,0.12)]">
								<CardContent className="p-6 space-y-4">
									<div className="flex items-center gap-3">
										<div className="size-8 rounded-lg bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center">
											<svg
												className="w-4 h-4 text-cyan-300"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M9 12h6m-6 4h6m-6-8h6M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
												/>
											</svg>
										</div>
										<h3 className="text-white font-bold">任务描述</h3>
									</div>
									<p className="text-slate-400 leading-relaxed">
										{job.description ?? "暂无描述"}
									</p>
								</CardContent>
							</Card>

							<Card className="border-white/10 bg-gradient-to-br from-slate-950/70 via-slate-950/60 to-purple-950/40 shadow-[0_16px_40px_rgba(147,51,234,0.12)]">
								<CardContent className="p-6 space-y-4">
									<div className="flex items-center gap-3">
										<div className="size-8 rounded-lg bg-purple-500/10 border border-purple-400/20 flex items-center justify-center">
											<svg
												className="w-4 h-4 text-purple-300"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M5 7l7-4 7 4v10l-7 4-7-4V7z"
												/>
											</svg>
										</div>
										<h3 className="text-white font-bold">标签</h3>
									</div>
									{job.tags.length > 0 ? (
										<div className="flex gap-2 flex-wrap">
											{job.tags.map((tag) => (
												<Badge
													key={tag}
													variant="outline"
													className="border-cyan-500/20 text-cyan-100"
												>
													{tag}
												</Badge>
											))}
										</div>
									) : (
										<p className="text-slate-500 text-sm">暂无标签</p>
									)}
								</CardContent>
							</Card>
						</div>

						<div className="space-y-6">
							<Card className="bg-slate-900/50 border-blue-500/20 shadow-[0_14px_40px_rgba(59,130,246,0.15)]">
								<CardHeader>
									<h4 className="font-black text-xs uppercase tracking-[0.2em] text-blue-300">
										任务信息
									</h4>
								</CardHeader>
								<CardContent className="space-y-4 text-sm">
									<div className="flex items-center justify-between">
										<span className="text-slate-500">创建时间</span>
										<span className="text-white font-semibold">
											{createdAtLabel}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-slate-500">截止日期</span>
										<span className="text-white font-semibold">
											{deadlineLabel}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-slate-500">支付方式</span>
										<span className="text-white font-semibold">
											{paymentMethodLabel}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-slate-500">币种</span>
										<span className="text-white font-semibold">
											{job.currency ?? "—"}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-slate-500">优先级</span>
										<span className="text-white font-semibold">
											{job.priority}
										</span>
									</div>
								</CardContent>
							</Card>

							<Card className="bg-gradient-to-br from-purple-600/15 via-slate-900/50 to-blue-600/10 border-purple-500/20">
								<CardHeader>
									<h4 className="font-black text-xs uppercase tracking-[0.2em] text-purple-300">
										任务要求
									</h4>
								</CardHeader>
								<CardContent className="space-y-4 text-sm">
									<div className="flex items-center justify-between">
										<span className="text-slate-500">技能等级</span>
										<span className="text-white font-semibold">
											{job.requiredSkillLevel}
										</span>
									</div>
									<div className="space-y-1">
										<span className="text-slate-500">交付物说明</span>
										<p className="text-slate-200 leading-relaxed">
											{job.deliverables ?? "暂无"}
										</p>
									</div>
									<div className="space-y-1">
										<span className="text-slate-500">验收标准</span>
										<p className="text-slate-200 leading-relaxed">
											{job.acceptanceCriteria ?? "暂无"}
										</p>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</>
			)}
		</div>
	);
};

export default JobDetail;
