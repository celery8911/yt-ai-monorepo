import { request } from "@yt/libs/http";

export type EngagementRecord = {
	id: string;
	engagementId: string;
	user: string;
	agentId: string;
	agentOwner: string;
	jobId?: string | null;
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
	return request<EngagementsByUserResponse>({
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
	return request<EscrowsByPayerResponse>({
		url: "/chain-status/escrow/by-payer",
		method: "GET",
		params: { payer, activeOnly },
	});
};
