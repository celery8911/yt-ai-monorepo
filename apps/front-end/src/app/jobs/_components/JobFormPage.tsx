"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	Input,
	Select,
	Switch,
	Textarea,
	useToast,
} from "@yt/ui";
import {
	createJob,
	fetchJobDetail,
	updateJob,
	type CreateJobPayload,
	type Job,
} from "@/apis/jobs";
import { useWallet } from "@yt/hooks";
import { createJobDraft } from "@/apis/drafts";

type JobFormPageProps = {
	jobId?: string;
};

type JobDraftFields = Awaited<ReturnType<typeof createJobDraft>>["fields"];

const formatDateInput = (value?: string): string => {
	if (!value) return "";
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return "";
	return parsed.toISOString().slice(0, 10);
};

const JobFormPage = ({ jobId }: JobFormPageProps) => {
	const router = useRouter();
	const [job, setJob] = useState<Job | null>(null);
	const [loading, setLoading] = useState(false);

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [category, setCategory] = useState("");
	const [tags, setTags] = useState("");
	const [paymentMethod, setPaymentMethod] =
		useState<CreateJobPayload["paymentMethod"]>("PER_TASK");
	const [budgetMin, setBudgetMin] = useState("");
	const [budgetMax, setBudgetMax] = useState("");
	const [currency, setCurrency] = useState<CreateJobPayload["currency"]>("CBT");
	const [requiredSkillLevel, setRequiredSkillLevel] =
		useState<CreateJobPayload["requiredSkillLevel"]>("INTERMEDIATE");
	const [deliverables, setDeliverables] = useState("");
	const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
	const [deadlineAt, setDeadlineAt] = useState("");
	const [priority, setPriority] =
		useState<CreateJobPayload["priority"]>("MEDIUM");
	const [visibility, setVisibility] =
		useState<CreateJobPayload["visibility"]>("public");
	const [autoMatchEnabled, setAutoMatchEnabled] = useState(true);
	const [biddingEnabled, setBiddingEnabled] = useState(true);
	const [escrowEnabled, setEscrowEnabled] = useState(true);
	const [reviewWindowDays, setReviewWindowDays] = useState("7");
	const [payoutStrategy, setPayoutStrategy] =
		useState<CreateJobPayload["payoutStrategy"]>("WINNER_TAKE_ALL");
	const [draftInput, setDraftInput] = useState("");
	const [draftMissing, setDraftMissing] = useState<string[]>([]);
	const [draftNotes, setDraftNotes] = useState<string[]>([]);
	const [draftLoading, setDraftLoading] = useState(false);
	const [draftGenerated, setDraftGenerated] = useState(false);
	const { address } = useWallet();
	const { toast } = useToast();

	const withRequiredMark = (label: string) => (
		<span>
			<span className="text-rose-400">*</span>
			{label}
		</span>
	);

	useEffect(() => {
		if (!jobId) return;
		const loadJob = async () => {
			setLoading(true);
			try {
				const data = await fetchJobDetail(jobId);
				setJob(data.job);
				setTitle(data.job.title ?? "");
				setDescription(data.job.description ?? "");
				setCategory(data.job.category ?? "");
				setTags(data.job.tags.join(", "));
				setPaymentMethod(data.job.paymentMethod);
				setBudgetMin(
					data.job.budgetMin !== undefined ? String(data.job.budgetMin) : "",
				);
				setBudgetMax(
					data.job.budgetMax !== undefined ? String(data.job.budgetMax) : "",
				);
				setCurrency("CBT");
				setRequiredSkillLevel(data.job.requiredSkillLevel);
				setDeliverables(data.job.deliverables ?? "");
				setAcceptanceCriteria(data.job.acceptanceCriteria ?? "");
				setDeadlineAt(formatDateInput(data.job.deadlineAt));
				setPriority(data.job.priority);
				setVisibility(data.job.visibility);
				setAutoMatchEnabled(data.job.autoMatchEnabled);
				setBiddingEnabled(data.job.biddingEnabled);
				setEscrowEnabled(data.job.escrowEnabled);
				setReviewWindowDays(String(data.job.reviewWindowDays ?? 7));
				setPayoutStrategy(data.job.payoutStrategy);
			} catch (loadError) {
				const message =
					loadError instanceof Error ? loadError.message : "请求失败";
				toast({ message, variant: "error" });
			} finally {
				setLoading(false);
			}
		};
		loadJob();
	}, [jobId, toast]);

	const isEditing = Boolean(jobId);
	const canEditDraft = useMemo(
		() => (isEditing ? job?.status === "DRAFT" : true),
		[isEditing, job?.status],
	);

	const requiredMissing = useMemo(() => {
		const list: { key: string; label: string; missing: boolean }[] = [
			{ key: "fields.title", label: "任务标题", missing: !title.trim() },
			{ key: "fields.category", label: "分类", missing: !category.trim() },
			{
				key: "fields.tags",
				label: "标签",
				missing:
					tags
						.split(",")
						.map((tag) => tag.trim())
						.filter(Boolean).length === 0,
			},
			{
				key: "fields.requiredSkillLevel",
				label: "技能等级",
				missing: !requiredSkillLevel,
			},
			{
				key: "fields.priority",
				label: "优先级",
				missing: !priority,
			},
			{
				key: "fields.biddingEnabled",
				label: "开启竞价",
				missing: typeof biddingEnabled !== "boolean",
			},
			{
				key: "fields.escrowEnabled",
				label: "资金托管",
				missing: typeof escrowEnabled !== "boolean",
			},
			{
				key: "fields.createdBy",
				label: "发布人地址",
				missing: !address,
			},
		];
		return list.filter((item) => item.missing).map((item) => item.key);
	}, [
		address,
		biddingEnabled,
		escrowEnabled,
		priority,
		requiredSkillLevel,
		tags,
		title,
		category,
	]);

	const missingLabelMap = useMemo(
		() =>
			new Map<string, string>([
				["fields.title", "任务标题"],
				["fields.category", "分类"],
				["fields.tags", "标签"],
				["fields.requiredSkillLevel", "技能等级"],
				["fields.priority", "优先级"],
				["fields.biddingEnabled", "开启竞价"],
				["fields.escrowEnabled", "资金托管"],
				["fields.createdBy", "发布人地址"],
				["fields.description", "详细说明"],
				["fields.deadlineAt", "截止日期"],
				["fields.deliverables", "交付物说明"],
				["fields.acceptanceCriteria", "验收标准"],
				["fields.reviewWindowDays", "验收期"],
				["fields.status", "发布状态"],
			]),
		[],
	);

	const displayMissingFields = useMemo(() => {
		const merged = new Set<string>([...draftMissing, ...requiredMissing]);
		return Array.from(merged);
	}, [draftMissing, requiredMissing]);

	const applyDraftFields = (fields: JobDraftFields = {}) => {
		if (typeof fields.title === "string" && fields.title.trim()) {
			setTitle(fields.title);
		}
		if (typeof fields.description === "string" && fields.description.trim()) {
			setDescription(fields.description);
		}
		if (typeof fields.category === "string" && fields.category.trim()) {
			setCategory(fields.category);
		}
		if (Array.isArray(fields.tags) && fields.tags.length > 0) {
			setTags(fields.tags.join(", "));
		}
		if (fields.paymentMethod) {
			setPaymentMethod(fields.paymentMethod);
		}
		if (typeof fields.budgetMin === "number") {
			setBudgetMin(String(fields.budgetMin));
		}
		if (typeof fields.budgetMax === "number") {
			setBudgetMax(String(fields.budgetMax));
		}
		if (typeof fields.currency === "string" && fields.currency.trim()) {
			setCurrency(fields.currency);
		}
		if (fields.requiredSkillLevel) {
			setRequiredSkillLevel(fields.requiredSkillLevel);
		}
		if (typeof fields.deliverables === "string" && fields.deliverables.trim()) {
			setDeliverables(fields.deliverables);
		}
		if (
			typeof fields.acceptanceCriteria === "string" &&
			fields.acceptanceCriteria.trim()
		) {
			setAcceptanceCriteria(fields.acceptanceCriteria);
		}
		if (typeof fields.deadlineAt === "string" && fields.deadlineAt.trim()) {
			setDeadlineAt(formatDateInput(fields.deadlineAt));
		}
		if (fields.priority) {
			setPriority(fields.priority);
		}
		if (typeof fields.autoMatchEnabled === "boolean") {
			setAutoMatchEnabled(fields.autoMatchEnabled);
		}
		if (typeof fields.biddingEnabled === "boolean") {
			setBiddingEnabled(fields.biddingEnabled);
		}
		if (typeof fields.escrowEnabled === "boolean") {
			setEscrowEnabled(fields.escrowEnabled);
		}
		if (fields.visibility) {
			setVisibility(fields.visibility);
		}
		if (typeof fields.reviewWindowDays === "number") {
			setReviewWindowDays(String(fields.reviewWindowDays));
		}
		if (fields.payoutStrategy) {
			setPayoutStrategy(fields.payoutStrategy);
		}
	};

	const handleGenerateDraft = async () => {
		if (!draftInput.trim()) {
			toast({ message: "请先输入需求描述。", variant: "error" });
			return;
		}

		setDraftLoading(true);
		try {
			const draft = await createJobDraft({
				text: draftInput.trim(),
				draftType: "job",
				createdBy: address,
			});
			applyDraftFields(draft.fields ?? {});
			setDraftMissing(draft.missing ?? []);
			setDraftNotes(draft.notes ?? []);
			setDraftGenerated(true);
			toast({ message: "草案已生成，请补全缺失项。", variant: "success" });
		} catch (draftError) {
			const message =
				draftError instanceof Error ? draftError.message : "草案生成失败";
			toast({ message, variant: "error" });
		} finally {
			setDraftLoading(false);
		}
	};

	const handleSubmit = async (status: CreateJobPayload["status"] = "OPEN") => {
		const trimmedTitle = title.trim();
		const tagsList = tags
			.split(",")
			.map((tag) => tag.trim())
			.filter(Boolean);
		if (!trimmedTitle) {
			toast({ message: "请填写任务标题。", variant: "error" });
			return;
		}
		if (!address) {
			toast({ message: "请先连接钱包。", variant: "error" });
			return;
		}

		if (status !== "DRAFT") {
			if (!category.trim()) {
				toast({ message: "请选择任务分类。", variant: "error" });
				return;
			}
			if (!tagsList.length) {
				toast({ message: "请至少填写一个标签。", variant: "error" });
				return;
			}
			if (!description.trim()) {
				toast({ message: "请填写详细说明。", variant: "error" });
				return;
			}
			if (!deadlineAt) {
				toast({ message: "请选择截止日期。", variant: "error" });
				return;
			}
		}

		const parsedBudgetMin = budgetMin !== "" ? Number(budgetMin) : undefined;
		const parsedBudgetMax = budgetMax !== "" ? Number(budgetMax) : undefined;
		const hasBudgetMin =
			parsedBudgetMin !== undefined && !Number.isNaN(parsedBudgetMin);
		const hasBudgetMax =
			parsedBudgetMax !== undefined && !Number.isNaN(parsedBudgetMax);
		const parsedReviewWindowDays =
			reviewWindowDays !== "" ? Number(reviewWindowDays) : undefined;
		const hasReviewWindowDays =
			parsedReviewWindowDays !== undefined &&
			!Number.isNaN(parsedReviewWindowDays);
		if (status !== "DRAFT") {
			if (paymentMethod !== "FREE" && !hasBudgetMin && !hasBudgetMax) {
				toast({ message: "请填写预算下限或上限。", variant: "error" });
				return;
			}
			if (!hasReviewWindowDays) {
				toast({ message: "请填写验收期天数。", variant: "error" });
				return;
			}
		}
		const payload = {
			title: trimmedTitle,
			description: description.trim() || undefined,
			category: category.trim() || undefined,
			tags: tagsList,
			paymentMethod,
			budgetMin: hasBudgetMin ? parsedBudgetMin : undefined,
			budgetMax: hasBudgetMax ? parsedBudgetMax : undefined,
			currency: paymentMethod === "FREE" ? undefined : currency,
			requiredSkillLevel,
			deliverables: deliverables.trim() || undefined,
			acceptanceCriteria: acceptanceCriteria.trim() || undefined,
			deadlineAt: deadlineAt ? new Date(deadlineAt).toISOString() : undefined,
			priority,
			autoMatchEnabled,
			biddingEnabled,
			escrowEnabled,
			visibility: "public",
			reviewWindowDays: 7,
			payoutStrategy: "WINNER_TAKE_ALL",
			status,
			createdBy: address,
		} satisfies CreateJobPayload;

		setLoading(true);
		try {
			if (jobId) {
				await updateJob(jobId, payload);
				toast({
					message: status === "DRAFT" ? "草稿已保存" : "任务已更新",
					variant: "success",
				});
				router.push(status === "DRAFT" ? "/jobs" : `/jobs/${jobId}`);
			} else {
				const response = await createJob(payload);
				toast({
					message: status === "DRAFT" ? "草稿已保存" : "任务已发布",
					variant: "success",
				});
				router.push(status === "DRAFT" ? "/jobs" : `/jobs/${response.job.id}`);
			}
		} catch (submitError) {
			const message =
				submitError instanceof Error ? submitError.message : "提交失败";
			toast({ message, variant: "error" });
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="max-w-2xl mx-auto pb-20 space-y-8">
			<Button
				variant="ghost"
				onClick={() => router.push(isEditing ? `/jobs/${jobId}` : "/jobs")}
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
				返回
			</Button>

			<div>
				<h1 className="text-4xl font-black neon-text">
					{isEditing ? "修改任务" : "发布新需求"}
				</h1>
				<p className="text-slate-400">
					{isEditing
						? "更新草稿内容并发布到任务大厅。"
						: "描述你需要的服务，智能代理将参与竞价。"}
				</p>
			</div>

			{!loading && isEditing && job && !canEditDraft ? (
				<Card className="border-rose-500/20 bg-rose-500/5">
					<CardContent className="p-6 text-rose-400 text-sm">
						当前任务不是草稿状态，无法编辑。
					</CardContent>
				</Card>
			) : null}

			{loading && isEditing && !job ? (
				<Card className="border-white/5 bg-slate-900/30">
					<CardContent className="p-8 text-center text-slate-500 text-sm">
						正在加载任务信息...
					</CardContent>
				</Card>
			) : null}

			{!canEditDraft ? null : (
				<>
					{!isEditing ? (
						<Card className="border-blue-500/30 bg-blue-500/5">
							<CardHeader>
								<h3 className="font-black text-sm uppercase">智能生成草案</h3>
							</CardHeader>
							<CardContent className="space-y-4">
								<Textarea
									label="需求描述"
									placeholder="用自然语言描述你的需求，例如：我想要一份某代币的链上持仓分析报告，包含Top地址分布与可视化图表。"
									value={draftInput}
									onChange={(event) => setDraftInput(event.target.value)}
								/>
								<div className="flex items-center justify-between">
									<p className="text-xs text-slate-400">
										系统会自动生成草案字段并标记缺失项。
									</p>
									<Button onClick={handleGenerateDraft} disabled={draftLoading}>
										{draftLoading ? "生成中..." : "生成草案"}
									</Button>
								</div>
								{draftGenerated && displayMissingFields.length > 0 ? (
									<div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
										<div className="font-bold mb-2">待补全字段</div>
										<div className="flex flex-wrap gap-2 text-xs">
											{displayMissingFields.map((field) => (
												<span
													key={field}
													className="rounded-full border border-amber-400/40 px-3 py-1"
												>
													{missingLabelMap.get(field) ?? field}
												</span>
											))}
										</div>
									</div>
								) : null}
								{draftNotes.length > 0 ? (
									<div className="rounded-lg border border-slate-500/30 bg-slate-900/30 p-4 text-xs text-slate-300 space-y-1">
										{draftNotes.map((note) => (
											<div key={note}>- {note}</div>
										))}
									</div>
								) : null}
							</CardContent>
						</Card>
					) : null}
					<Card>
						<CardHeader>
							<h3 className="font-black text-sm uppercase">基本需求</h3>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<Input
									label={withRequiredMark("任务标题")}
									placeholder="例如: 自动分析某代币的链上持仓分布"
									value={title}
									onChange={(event) => setTitle(event.target.value)}
								/>
								<Select
									label={withRequiredMark("分类")}
									value={category}
									onChange={(event) => setCategory(event.target.value)}
								>
									<option value="">选择任务分类</option>
									<option value="数据分析">数据分析</option>
									<option value="合约开发">合约开发</option>
									<option value="产品设计">产品设计</option>
									<option value="运营增长">运营增长</option>
									<option value="内容与研究">内容与研究</option>
								</Select>
							</div>
							<Input
								label={withRequiredMark("标签 (逗号分隔)")}
								placeholder="onchain, defi, report"
								value={tags}
								onChange={(event) => setTags(event.target.value)}
							/>
							<Textarea
								label={withRequiredMark("详细说明")}
								placeholder="详细说明任务目标、数据来源及交付物要求..."
								value={description}
								onChange={(event) => setDescription(event.target.value)}
							/>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<h3 className="font-black text-sm uppercase">支付设置</h3>
						</CardHeader>
						<CardContent className="space-y-6">
							<Select
								label={withRequiredMark("支付方式")}
								value={paymentMethod}
								onChange={(event) =>
									setPaymentMethod(
										event.target.value as CreateJobPayload["paymentMethod"],
									)
								}
							>
								<option value="FREE">免费</option>
								<option value="PER_TASK">按任务支付</option>
								<option value="HUMAN_HIRING">人工雇佣</option>
								<option value="RESULT_BASED">结果付费</option>
							</Select>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<Input
									label={withRequiredMark("预算下限")}
									placeholder="100"
									value={budgetMin}
									onChange={(event) => setBudgetMin(event.target.value)}
									disabled={paymentMethod === "FREE"}
								/>
								<Input
									label={withRequiredMark("预算上限")}
									placeholder="500"
									value={budgetMax}
									onChange={(event) => setBudgetMax(event.target.value)}
									disabled={paymentMethod === "FREE"}
								/>
							</div>
							<Select
								label={withRequiredMark("币种")}
								value={currency}
								onChange={(event) => setCurrency(event.target.value)}
								disabled={paymentMethod === "FREE"}
							>
								<option value="CBT">CBT</option>
							</Select>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<h3 className="font-black text-sm uppercase">任务要求</h3>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<Input
									label={withRequiredMark("截止日期")}
									type="date"
									value={deadlineAt}
									onChange={(event) => setDeadlineAt(event.target.value)}
									className="[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-200"
								/>
								<Select
									label={withRequiredMark("优先级")}
									value={priority}
									onChange={(event) =>
										setPriority(
											event.target.value as CreateJobPayload["priority"],
										)
									}
								>
									<option value="LOW">低</option>
									<option value="MEDIUM">中</option>
									<option value="HIGH">高</option>
									<option value="URGENT">紧急</option>
								</Select>
							</div>
							<Select
								label={withRequiredMark("技能等级")}
								value={requiredSkillLevel}
								onChange={(event) =>
									setRequiredSkillLevel(
										event.target
											.value as CreateJobPayload["requiredSkillLevel"],
									)
								}
							>
								<option value="BEGINNER">新手</option>
								<option value="INTERMEDIATE">中级</option>
								<option value="ADVANCED">高级</option>
								<option value="EXPERT">专家</option>
							</Select>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<h3 className="font-black text-sm uppercase">高级选项</h3>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div>
										<h4 className="text-sm font-bold">自动匹配</h4>
										<p className="text-[10px] text-slate-500 uppercase">
											由系统自动筛选最合适的智能体
										</p>
									</div>
									<Switch
										checked={autoMatchEnabled}
										onChange={setAutoMatchEnabled}
									/>
								</div>
							</div>
							<Input
								label="发布人地址"
								placeholder="未连接钱包"
								value={address ?? ""}
								disabled
							/>
						</CardContent>
					</Card>

					<div className="flex gap-4">
						<Button
							variant="outline"
							className="flex-1 py-6"
							onClick={() => handleSubmit("DRAFT")}
							disabled={loading}
						>
							{isEditing ? "保存草稿" : "存为草稿"}
						</Button>
						<Button
							className="flex-1 py-6 shadow-xl shadow-blue-600/20"
							onClick={() => handleSubmit("OPEN")}
							disabled={loading}
						>
							{loading ? "提交中..." : "发布"}
						</Button>
					</div>
				</>
			)}
		</div>
	);
};

export default JobFormPage;
