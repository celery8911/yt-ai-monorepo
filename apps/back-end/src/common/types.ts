export type PaymentMethod =
	| "FREE"
	| "PER_TASK"
	| "HUMAN_HIRING"
	| "RESULT_BASED";
export type SkillLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
export type PriorityLevel = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type PayoutStrategy = "WINNER_TAKE_ALL" | "SPLIT_IF_NO_SELECTION";
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

export type DeliverableType =
	| "CODE"
	| "DOCUMENTATION"
	| "DEPLOYMENT"
	| "REPORT"
	| "DATASET"
	| "MODEL";

export type EscrowStatus = "LOCKED" | "RELEASED" | "DISPUTED" | "FROZEN";
export type DisputeStatus = "OPEN" | "VOTING" | "RESOLVED";
export type DisputeOutcome =
	| "RELEASE_TO_AGENT"
	| "SPLIT"
	| "REFUND_PAYER"
	| "FREEZE";

export interface Job {
	id: string;
	title: string;
	description?: string;
	category?: string;
	tags: string[];
	paymentMethod: PaymentMethod;
	budgetMin?: number;
	budgetMax?: number;
	currency?: string;
	requiredSkillLevel: SkillLevel;
	deliverables?: string;
	acceptanceCriteria?: string;
	deadlineAt?: string;
	priority: PriorityLevel;
	autoMatchEnabled: boolean;
	biddingEnabled: boolean;
	escrowEnabled: boolean;
	visibility: "public" | "private";
	reviewWindowDays: number;
	payoutStrategy: PayoutStrategy;
	status: JobStatus;
	createdBy: string;
	selectedAgentId?: string;
	matchError?: string;
	createdAt: string;
}

export interface Agent {
	id: string;
	name: string;
	description?: string;
	category?: string;
	tags: string[];
	endpointUrl: string;
	supportedPaymentMethods: PaymentMethod[];
	skillLevel: SkillLevel;
	deliverableFormats: DeliverableType[];
	pricePerTask?: number;
	resultBasedMinPrice?: number;
	minBid?: number;
	currency?: string;
	avgResponseTimeMs?: number;
	successRate?: number;
	rating?: number;
	owner: string;
	visibility: "public" | "private";
	isActive: boolean;
}

export interface Bid {
	id: string;
	jobId: string;
	agentId: string;
	bidPrice: number;
	currency: string;
	message?: string;
	status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
	createdAt: string;
}

export interface Escrow {
	id: string;
	jobId: string;
	payer: string;
	amount: number;
	currency: string;
	status: EscrowStatus;
	releaseTo?: string;
	createdAt: string;
	releasedAt?: string;
}

export interface Wallet {
	address: string;
	balance: number;
	lockedAmount: number;
	totalEarnings: number;
	totalSpent: number;
	updatedAt: string;
}

export interface Bill {
	id: string;
	jobId: string;
	agentId: string;
	amount: number;
	currency: string;
	status: "PENDING" | "PAID" | "REFUNDED";
	escrowId?: string;
	payeeAddress: string;
	payerAddress: string;
	createdAt: string;
	paidAt?: string;
}

export interface Dispute {
	id: string;
	jobId: string;
	escrowId: string;
	initiator: string;
	reason?: string;
	status: DisputeStatus;
	votesFor: number;
	votesAgainst: number;
	totalWeight: number;
	resolvedOutcome?: DisputeOutcome;
	createdAt: string;
	resolvedAt?: string;
}

export interface Vote {
	id: string;
	disputeId: string;
	voter: string;
	vote: "approve" | "reject";
	weight: number;
	createdAt: string;
}
