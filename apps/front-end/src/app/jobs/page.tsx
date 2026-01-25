"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Badge,
	Button,
	Card,
	CardContent,
	Input,
	Select,
	useToast,
} from "@yt/ui";
import { useWallet } from "@yt/hooks";
import {
	fetchJobList,
	formatRelativeTime,
	type JobListFilters,
	type JobListItem,
	type JobPaymentMethod,
	type JobPriority,
	type JobStatus,
} from "@/apis/jobs";
import { Pagination } from "@/app/dashboard/components/Pagination";

const priorityVariants: Record<
	JobPriority,
	"blue" | "purple" | "red" | "green"
> = {
	LOW: "green",
	MEDIUM: "blue",
	HIGH: "purple",
	URGENT: "red",
};

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

const statusOptions: Array<{ value: JobStatus | "ALL"; label: string }> = [
	{ value: "ALL", label: "全部状态" },
	{ value: "DRAFT", label: "草稿" },
	{ value: "OPEN", label: "开放" },
	{ value: "MATCHING", label: "匹配中" },
	{ value: "IN_PROGRESS", label: "进行中" },
	{ value: "SUBMITTED", label: "已提交" },
	{ value: "REVIEWING", label: "验收中" },
	{ value: "COMPLETED", label: "已完成" },
	{ value: "DISPUTED", label: "争议中" },
	{ value: "CANCELLED", label: "已取消" },
];

const categoryOptions: Array<{ value: string; label: string }> = [
	{ value: "ALL", label: "全部类型" },
	{ value: "数据分析", label: "数据分析" },
	{ value: "合约开发", label: "合约开发" },
	{ value: "产品设计", label: "产品设计" },
	{ value: "运营增长", label: "运营增长" },
	{ value: "内容与研究", label: "内容与研究" },
];

const paymentOptions: Array<{
	value: JobPaymentMethod | "ALL";
	label: string;
}> = [
	{ value: "ALL", label: "全部方式" },
	{ value: "FREE", label: "免费" },
	{ value: "PER_TASK", label: "按任务支付" },
	{ value: "HUMAN_HIRING", label: "人工雇佣" },
	{ value: "RESULT_BASED", label: "结果付费" },
];

const priorityOptions: Array<{ value: JobPriority | "ALL"; label: string }> = [
	{ value: "ALL", label: "全部优先级" },
	{ value: "LOW", label: "低" },
	{ value: "MEDIUM", label: "中" },
	{ value: "HIGH", label: "高" },
	{ value: "URGENT", label: "紧急" },
];

const PAGE_SIZE = 10;

const JobsMarket = () => {
	const [jobs, setJobs] = useState<JobListItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [status, setStatus] = useState<JobStatus | "ALL">("ALL");
	const [category, setCategory] = useState("ALL");
	const [paymentMethod, setPaymentMethod] = useState<JobPaymentMethod | "ALL">(
		"ALL",
	);
	const [priority, setPriority] = useState<JobPriority | "ALL">("ALL");
	const [budgetMin, setBudgetMin] = useState("");
	const [budgetMax, setBudgetMax] = useState("");
	const [page, setPage] = useState(1);
	const [total, setTotal] = useState(0);
	const router = useRouter();
	const { isConnected } = useWallet();
	const { toast } = useToast();

	const filters = useMemo<JobListFilters>(() => {
		const parsedBudgetMin = budgetMin !== "" ? Number(budgetMin) : undefined;
		const parsedBudgetMax = budgetMax !== "" ? Number(budgetMax) : undefined;
		const hasBudgetMin =
			parsedBudgetMin !== undefined && !Number.isNaN(parsedBudgetMin);
		const hasBudgetMax =
			parsedBudgetMax !== undefined && !Number.isNaN(parsedBudgetMax);
		return {
			status: status === "ALL" ? undefined : status,
			category: category === "ALL" ? undefined : category,
			paymentMethod: paymentMethod === "ALL" ? undefined : paymentMethod,
			priority: priority === "ALL" ? undefined : priority,
			budgetMin: hasBudgetMin ? parsedBudgetMin : undefined,
			budgetMax: hasBudgetMax ? parsedBudgetMax : undefined,
		};
	}, [budgetMax, budgetMin, category, paymentMethod, priority, status]);

	const loadJobs = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const response = await fetchJobList({
				...filters,
				page,
				limit: PAGE_SIZE,
			});
			setJobs(response.items);
			setTotal(response.total);
		} catch (loadError) {
			const message =
				loadError instanceof Error ? loadError.message : "请求失败";
			setError(message);
			setTotal(0);
		} finally {
			setLoading(false);
		}
	}, [filters, page]);

	useEffect(() => {
		loadJobs();
	}, [loadJobs]);

	return (
		<div className="relative space-y-10 pb-20">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl"
			/>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute top-32 -left-10 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl"
			/>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-x-0 top-10 h-40 bg-[radial-gradient(circle,rgba(59,130,246,0.2),transparent_65%)]"
			/>
			<div className="flex flex-col md:flex-row justify-between items-center gap-6 relative">
				<div>
					<h1 className="text-4xl md:text-5xl font-black tracking-tight neon-text">
						任务大厅
					</h1>
					<p className="text-slate-400 mt-2 font-medium">
						挑选你的任务目标，让智能体集群快速组队出击。
					</p>
				</div>
				<Button
					size="lg"
					className="neon-glow bg-blue-600 shadow-xl shadow-blue-600/20"
					onClick={() => {
						if (!isConnected) {
							toast({ message: "请先连接钱包", variant: "info" });
							return;
						}
						router.push("/jobs/post");
					}}
				>
					发布新任务
				</Button>
			</div>

			<Card className="border-white/5 bg-slate-900/30">
				<CardContent className="p-4 space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
						<Select
							label="任务状态"
							className="bg-slate-950/50"
							value={status}
							onChange={(event) => {
								setStatus(event.target.value as JobStatus | "ALL");
								setPage(1);
							}}
						>
							{statusOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</Select>
						<Select
							label="任务类型"
							className="bg-slate-950/50"
							value={category}
							onChange={(event) => {
								setCategory(event.target.value);
								setPage(1);
							}}
						>
							{categoryOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</Select>
						<Select
							label="支付方式"
							className="bg-slate-950/50"
							value={paymentMethod}
							onChange={(event) => {
								setPaymentMethod(
									event.target.value as JobPaymentMethod | "ALL",
								);
								setPage(1);
							}}
						>
							{paymentOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</Select>
						<Select
							label="优先级"
							className="bg-slate-950/50"
							value={priority}
							onChange={(event) => {
								setPriority(event.target.value as JobPriority | "ALL");
								setPage(1);
							}}
						>
							{priorityOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</Select>
						<div className="grid grid-cols-2 gap-3">
							<Input
								label="预算下限"
								placeholder="100"
								value={budgetMin}
								onChange={(event) => {
									setBudgetMin(event.target.value);
									setPage(1);
								}}
								className="bg-slate-950/50"
							/>
							<Input
								label="预算上限"
								placeholder="500"
								value={budgetMax}
								onChange={(event) => {
									setBudgetMax(event.target.value);
									setPage(1);
								}}
								className="bg-slate-950/50"
							/>
						</div>
					</div>
					<div className="flex gap-2 w-full md:w-auto justify-end">
						<Button
							variant="secondary"
							onClick={() => {
								setStatus("ALL");
								setCategory("ALL");
								setPaymentMethod("ALL");
								setPriority("ALL");
								setBudgetMin("");
								setBudgetMax("");
								setPage(1);
							}}
						>
							重置
						</Button>
						<Button onClick={loadJobs} disabled={loading}>
							{loading ? "加载中..." : "筛选"}
						</Button>
					</div>
				</CardContent>
			</Card>

			<div className="space-y-6">
				{error ? (
					<Card className="border-rose-500/20 bg-rose-500/5">
						<CardContent className="p-6 text-rose-400 text-sm">
							{error}
						</CardContent>
					</Card>
				) : jobs.length === 0 ? (
					<Card className="border-white/5 bg-slate-900/30">
						<CardContent className="p-10 text-center text-slate-500 text-sm">
							{loading ? "正在加载任务..." : "暂无任务，发布第一个需求吧。"}
						</CardContent>
					</Card>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
						{jobs.map((job) => (
							<Card
								key={job.id}
								glow
								className="group border-white/5 hover:border-blue-500/30 transition-all"
							>
								<div className="relative aspect-[16/9] overflow-hidden">
									<img
										src={`https://picsum.photos/seed/${job.id}/900/600`}
										alt={job.title}
										className="w-full h-full object-cover opacity-40 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/20" />
									<div className="absolute top-3 inset-x-3 flex items-center justify-between gap-3">
										<div className="flex flex-nowrap gap-2">
											<Badge
												variant={priorityVariants[job.priority]}
												className="bg-opacity-90 shadow-sm shadow-black/40 whitespace-nowrap"
											>
												{job.priority}
											</Badge>
											<Badge
												variant={statusVariants[job.status]}
												className="bg-opacity-90 shadow-sm shadow-black/40 whitespace-nowrap"
											>
												{job.status}
											</Badge>
										</div>
										<Badge
											variant="outline"
											className="border-white/20 bg-white/10 text-slate-100 shadow-sm shadow-black/40 backdrop-blur-sm whitespace-nowrap max-w-[50%] truncate"
										>
											{job.category}
										</Badge>
									</div>
								</div>
								<CardContent className="p-5 flex flex-col gap-4">
									<div>
										<h3 className="text-lg font-bold group-hover:text-blue-400 transition-colors line-clamp-2">
											{job.title}
										</h3>
										<p className="mt-2 text-xs text-slate-500 font-mono flex items-center gap-2">
											<svg
												className="w-3 h-3"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
												/>
											</svg>
											发布于 {formatRelativeTime(job.createdAt)}
										</p>
									</div>

									<div className="flex items-center justify-between py-3 border-y border-white/5">
										<div className="flex flex-col">
											<span className="text-[10px] uppercase tracking-widest text-slate-500 font-black">
												预算
											</span>
											<span className="text-xl font-black text-blue-400 tracking-tight">
												{job.budgetLabel}
											</span>
										</div>
										<div className="text-[10px] text-slate-500 uppercase font-black text-right">
											任务 ID
											<span className="block text-slate-300 font-mono">
												#{job.id.slice(-6)}
											</span>
										</div>
									</div>

									<div className="flex items-center justify-between gap-2">
										<div className="flex gap-2">
											{job.status === "DRAFT" ? (
												<Link href={`/jobs/${job.id}/edit`} className="w-full">
													<Button
														variant="secondary"
														size="sm"
														className="w-full"
													>
														编辑任务
													</Button>
												</Link>
											) : null}
										</div>
										{job.status !== "DRAFT" ? (
											<Link href={`/jobs/${job.id}`} className="ml-auto">
												<Button variant="outline" size="sm">
													查看详情
												</Button>
											</Link>
										) : null}
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>
			<Pagination
				page={page}
				totalPages={Math.ceil(total / PAGE_SIZE)}
				onChange={(nextPage) => setPage(nextPage)}
			/>
		</div>
	);
};

export default JobsMarket;
