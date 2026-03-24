import { apiRequest } from "@/apis/client";

export type EngagementRecord = {
	id: string;
	engagementId: string;
	user: string;
	agentId: string;
	agentOwner: string;
	jobId?: string | null;
	escrowId?: string | null;
	purchaseType: string;
	totalPaid: string;
	startTime: string;
	endTime?: string | null;
	status: string;
};

export type EngagementsByUserResponse = {
	user: string;
	engagements: EngagementRecord[];
};

type PaginationParams = {
	first?: number;
	skip?: number;
};

export const fetchEngagementsByUser = async (
	user: string,
	pagination: PaginationParams = {},
): Promise<EngagementsByUserResponse> => {
	return apiRequest<EngagementsByUserResponse>({
		url: "/chain-status/engagement/by-user",
		method: "GET",
		params: { user, ...pagination },
	});
};

export type EscrowRecord = {
	id: string;
	jobId: string;
	payer: string;
	agent: string;
	amount: string;
	serviceFee: string;
	currency: string;
	status: string;
	createdAt: string;
	releaseAt: string;
	releasedAt?: string | null;
	refundedAt?: string | null;
	frozen: boolean;
};

export type EscrowsByPayerResponse = {
	payer: string;
	activeOnly: boolean;
	escrows: EscrowRecord[];
};

export const fetchEscrowsByPayer = async (
	payer: string,
	activeOnly = true,
): Promise<EscrowsByPayerResponse> => {
	return apiRequest<EscrowsByPayerResponse>({
		url: "/chain-status/escrow/by-payer",
		method: "GET",
		params: { payer, activeOnly },
	});
};

export type EscrowByJobResponse = {
	jobId: string;
	jobIdBytes32: string;
	isEmployed: boolean;
	escrow?: EscrowRecord | null;
};

export const fetchEscrowByJob = async (
	jobId: string,
): Promise<EscrowByJobResponse> => {
	return apiRequest<EscrowByJobResponse>({
		url: "/chain-status/escrow/by-job",
		method: "GET",
		params: { jobId },
	});
};

export type CbtTransferRecord = {
	id: string;
	from: string;
	to: string;
	amount: string;
	timestamp: string;
	transactionHash: string;
};

export type CbtTransfersResponse = {
	address: string;
	transfers: CbtTransferRecord[];
};

export const fetchCbtTransfersByAddress = async (
	address: string,
	pagination: PaginationParams = {},
): Promise<CbtTransfersResponse> => {
	return apiRequest<CbtTransfersResponse>({
		url: "/chain-status/cbt/transfers",
		method: "GET",
		params: { address, ...pagination },
	});
};
