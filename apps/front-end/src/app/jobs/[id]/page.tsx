"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
} from "@yt/ui";
import {
	fetchJobDetail,
	formatJobBudget,
	type MatchedAgent,
	type Job,
	type JobPriority,
	type JobStatus,
} from "@/apis/jobs";

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

	const renderScore = (value?: number) => {
		if (value === undefined) return "—";
		return value.toFixed(2);
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
							{showMatchError && job.matchError ? (
								<Card className="border-rose-500/20 bg-rose-500/10">
									<CardHeader>
										<h4 className="font-black text-xs uppercase tracking-[0.2em] text-rose-300">
											匹配失败原因
										</h4>
									</CardHeader>
									<CardContent className="text-rose-200 text-sm">
										{job.matchError}
									</CardContent>
								</Card>
							) : null}

							{job.status === "IN_PROGRESS" ? (
								<Card className="bg-gradient-to-br from-cyan-500/10 via-slate-900/50 to-blue-500/10 border-cyan-400/20">
									<CardHeader>
										<h4 className="font-black text-xs uppercase tracking-[0.2em] text-cyan-300">
											匹配到的智能体
										</h4>
									</CardHeader>
									<CardContent className="space-y-4 text-sm">
										{matches.length ? (
											matches.map((agent) => (
												<div
													key={agent.id}
													className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 space-y-2"
												>
													<div className="flex items-center justify-between">
														<span className="text-white font-semibold">
															{agent.name}
														</span>
														<span className="text-cyan-300 font-mono text-xs">
															评分: {renderScore(agent.score)}
														</span>
													</div>
													<div className="flex items-center justify-between text-xs text-slate-400">
														<span>评级: {agent.rating ?? "—"}</span>
														<span>成功率: {agent.successRate ?? "—"}</span>
														<span>
															响应: {agent.avgResponseTimeMs ?? "—"}ms
														</span>
													</div>
													{agent.tags?.length ? (
														<div className="flex flex-wrap gap-2">
															{agent.tags.slice(0, 3).map((tag) => (
																<Badge
																	key={tag}
																	variant="outline"
																	className="border-cyan-500/20 text-cyan-100"
																>
																	{tag}
																</Badge>
															))}
														</div>
													) : null}
												</div>
											))
										) : (
											<p className="text-slate-500 text-sm">暂无匹配结果</p>
										)}
									</CardContent>
								</Card>
							) : null}

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

							{showSelectedAgent ? (
								<Card className="bg-gradient-to-br from-emerald-500/10 via-slate-900/50 to-cyan-500/10 border-emerald-400/20">
									<CardHeader>
										<h4 className="font-black text-xs uppercase tracking-[0.2em] text-emerald-300">
											已选中智能体
										</h4>
									</CardHeader>
									<CardContent className="space-y-4 text-sm">
										{selectedAgent ? (
											<div className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 space-y-2">
												<div className="flex items-center justify-between">
													<span className="text-white font-semibold">
														{selectedAgent.name}
													</span>
													<span className="text-emerald-300 font-mono text-xs">
														评分: {renderScore(selectedAgent.score)}
													</span>
												</div>
												<div className="flex items-center justify-between text-xs text-slate-400">
													<span>评级: {selectedAgent.rating ?? "—"}</span>
													<span>
														成功率: {selectedAgent.successRate ?? "—"}
													</span>
													<span>
														响应: {selectedAgent.avgResponseTimeMs ?? "—"}ms
													</span>
												</div>
											</div>
										) : (
											<p className="text-slate-500 text-sm">
												暂无已选中智能体信息
											</p>
										)}
									</CardContent>
								</Card>
							) : null}

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
