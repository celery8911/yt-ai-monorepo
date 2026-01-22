import { request } from "@yt/libs/http";

export type JobStatus =
	| "DRAFT"
	| "OPEN"
	| "MATCHING"
	| "IN_PROGRESS"
	| "SUBMITTED"
	| "REVIEWING"
	| "COMPLETED"
	| "DISPUTED"
	| "CANCELLED"
	| "FAILED";

export type JobPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type JobPaymentMethod =
	| "FREE"
	| "PER_TASK"
	| "HUMAN_HIRING"
	| "RESULT_BASED";
export type JobSkillLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
export type JobVisibility = "public" | "private";
export type JobPayoutStrategy = "WINNER_TAKE_ALL" | "SPLIT_IF_NO_SELECTION";

export type Job = {
	id: string;
	title: string;
	description?: string;
	category?: string;
	tags: string[];
	paymentMethod: JobPaymentMethod;
	budgetMin?: number;
	budgetMax?: number;
	currency?: string;
	requiredSkillLevel: JobSkillLevel;
	deliverables?: string;
	acceptanceCriteria?: string;
	deadlineAt?: string;
	priority: JobPriority;
	autoMatchEnabled: boolean;
	biddingEnabled: boolean;
	escrowEnabled: boolean;
	visibility: JobVisibility;
	reviewWindowDays: number;
	payoutStrategy: JobPayoutStrategy;
	status: JobStatus;
	createdBy: string;
	selectedAgentId?: string;
	matchError?: string;
	createdAt: string;
};

export type MatchedAgent = {
	id: string;
	name: string;
	skillLevel?: JobSkillLevel;
	rating?: number;
	successRate?: number;
	avgResponseTimeMs?: number;
	tags?: string[];
	score?: number;
	pricePerTask?: number;
	resultBasedMinPrice?: number;
	minBid?: number;
	currency?: string;
	owner?: string;
};

export type JobDetailResponse = {
	job: Job;
	matches: MatchedAgent[];
	selectedAgent?: MatchedAgent;
};

export type JobListItem = {
	id: string;
	title: string;
	category: string;
	priority: JobPriority;
	status: JobStatus;
	createdAt: string;
	budgetLabel: string;
};

export type JobListFilters = {
	status?: JobStatus;
	category?: string;
	tag?: string;
	paymentMethod?: JobPaymentMethod;
	priority?: JobPriority;
	budgetMin?: number;
	budgetMax?: number;
	page?: number;
	limit?: number;
};

export type CreateJobPayload = {
	title: string;
	description?: string;
	category?: string;
	tags: string[];
	paymentMethod: JobPaymentMethod;
	budgetMin?: number;
	budgetMax?: number;
	currency?: string;
	requiredSkillLevel: JobSkillLevel;
	deliverables?: string;
	acceptanceCriteria?: string;
	deadlineAt?: string;
	priority: JobPriority;
	autoMatchEnabled: boolean;
	biddingEnabled: boolean;
	escrowEnabled: boolean;
	visibility: JobVisibility;
	reviewWindowDays?: number;
	payoutStrategy: JobPayoutStrategy;
	status?: JobStatus;
	createdBy: string;
};

export type UpdateJobPayload = {
	title?: string;
	description?: string;
	category?: string;
	tags?: string[];
	paymentMethod?: JobPaymentMethod;
	budgetMin?: number;
	budgetMax?: number;
	currency?: string;
	requiredSkillLevel?: JobSkillLevel;
	deliverables?: string;
	acceptanceCriteria?: string;
	deadlineAt?: string;
	priority?: JobPriority;
	autoMatchEnabled?: boolean;
	biddingEnabled?: boolean;
	escrowEnabled?: boolean;
	visibility?: JobVisibility;
	reviewWindowDays?: number;
	payoutStrategy?: JobPayoutStrategy;
	status?: JobStatus;
	createdBy?: string;
};

type JobListResponse = {
	data: Job[];
	page: number;
	limit: number;
	total: number;
};

type CreateJobResponse = {
	job: Job;
	matches: Array<{ id: string; name?: string; score?: number }>;
};

const formatCurrency = (amount: number, currency?: string): string =>
	currency ? `${amount} ${currency}` : `${amount}`;

export const formatJobBudget = (
	job: Pick<Job, "paymentMethod" | "budgetMin" | "budgetMax" | "currency">,
): string => {
	if (job.paymentMethod === "FREE") return "免费";
	const { budgetMin, budgetMax, currency } = job;
	if (budgetMin !== undefined && budgetMax !== undefined) {
		return `${formatCurrency(budgetMin, currency)} - ${formatCurrency(budgetMax, currency)}`;
	}
	if (budgetMax !== undefined) return formatCurrency(budgetMax, currency);
	if (budgetMin !== undefined) return formatCurrency(budgetMin, currency);
	return "价格待定";
};

export const formatRelativeTime = (isoString: string): string => {
	const time = new Date(isoString).getTime();
	if (Number.isNaN(time)) return "时间未知";
	const diff = Date.now() - time;
	if (diff < 60_000) return "刚刚";
	const minutes = Math.floor(diff / 60_000);
	if (minutes < 60) return `${minutes} 分钟前`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours} 小时前`;
	const days = Math.floor(hours / 24);
	return `${days} 天前`;
};

const toJobListItem = (job: Job): JobListItem => ({
	id: job.id,
	title: job.title,
	category: job.category ?? "未分类",
	priority: job.priority,
	status: job.status,
	createdAt: job.createdAt,
	budgetLabel: formatJobBudget(job),
});

export const fetchJobList = async (
	filters: JobListFilters = {},
): Promise<{
	items: JobListItem[];
	page: number;
	limit: number;
	total: number;
}> => {
	const data = await request<JobListResponse>({
		url: "/jobs",
		method: "GET",
		params: filters,
	});

	return {
		items: data.data.map(toJobListItem),
		page: data.page,
		limit: data.limit,
		total: data.total,
	};
};

export const fetchJobDetail = async (
	id: string,
): Promise<JobDetailResponse> => {
	return request<JobDetailResponse>({
		url: `/jobs/${id}`,
		method: "GET",
	});
};

export const createJob = async (
	payload: CreateJobPayload,
): Promise<CreateJobResponse> => {
	return request<CreateJobResponse>({
		url: "/jobs",
		method: "POST",
		data: payload,
	});
};

export const updateJob = async (
	id: string,
	payload: UpdateJobPayload,
): Promise<Job> => {
	return request<Job>({
		url: `/jobs/${id}`,
		method: "PUT",
		data: payload,
	});
};

export const selectJobAgent = async (
	jobId: string,
	agentId?: string,
): Promise<{
	job: Job;
	selectedAgentId?: string;
	matches: Array<{ id: string }>;
}> => {
	return request({
		url: `/jobs/${jobId}/select`,
		method: "PUT",
		data: { agentId },
	});
};

export const createJobDispute = async (
	jobId: string,
	payload: { initiator: string; reason?: string },
): Promise<{ job: Job; dispute: { id: string } }> => {
	return request({
		url: `/jobs/${jobId}/dispute`,
		method: "POST",
		data: payload,
	});
};
