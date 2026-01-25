export interface PaginationMeta {
	page: number;
	limit: number;
	total: number;
}

export interface PaginatedResponse<T> {
	data: T[];
	pagination: PaginationMeta;
}

export interface DashboardStatsResponse {
	walletBalance: number;
	lockedAmount: number;
	totalEarnings: number;
	totalSpent: number;
	publishedJobsCount: number;
	activeJobsCount: number;
	completedJobsCount: number;
	publishedAgentsCount: number;
	signedAgentsCount: number;
	openDisputesCount: number;
}

export interface PublishedJobItem {
	id: string;
	title: string;
	status: string;
	category?: string;
	budgetMin?: number;
	budgetMax?: number;
	currency?: string;
	priority?: string;
	bidsCount: number;
	selectedAgentId?: string;
	selectedAgentName?: string;
	createdAt: string;
	deadlineAt?: string;
}

export interface PublishedAgentItem {
	id: string;
	name: string;
	author?: string;
	owner?: string;
	category?: string;
	isActive: boolean;
	visibility?: string;
	skillLevel?: string;
	pricePerTask?: number;
	currency?: string;
	rating?: number;
	successRate?: number;
	activeJobsCount: number;
	completedJobsCount: number;
	totalEarnings: number;
	createdAt: string;
}

export interface SignedAgentItem {
	jobId: string;
	jobTitle: string;
	jobStatus: string;
	agentId?: string;
	agentName?: string;
	author?: string;
	owner?: string;
	agentCategory?: string;
	agentRating?: number;
	contractAmount?: number;
	currency?: string;
	contractStatus?: string;
	signedAt: string;
}

export interface DisputeItem {
	id: string;
	jobId: string;
	jobTitle?: string;
	status: string;
	initiator: string;
	isMyInitiated: boolean;
	reason?: string;
	votesFor: number;
	votesAgainst: number;
	totalWeight: number;
	escrowAmount?: number;
	currency?: string;
	resolvedOutcome?: string;
	createdAt: string;
	resolvedAt?: string;
}
