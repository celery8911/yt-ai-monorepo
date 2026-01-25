import { request } from "@yt/libs/http";

export type DisputeStatus = "OPEN" | "VOTING" | "RESOLVED";
export type VoteValue = "approve" | "reject";

export type Dispute = {
	id: string;
	jobId: string;
	escrowId?: string;
	initiator: string;
	reason?: string;
	status: DisputeStatus;
	votesFor: number;
	votesAgainst: number;
	totalWeight: number;
	resolvedOutcome?: string;
	createdAt: string;
	resolvedAt?: string;
	buyer?: string;
	seller?: string;
};

export type Vote = {
	id: string;
	disputeId: string;
	voter: string;
	vote: VoteValue;
	weight: number;
	createdAt: string;
};

export type DisputeListItem = Dispute & {
	role?: "BUYER" | "SELLER" | "UNKNOWN";
	jobTitle?: string;
	buyer?: string;
	seller?: string;
	escrowAmount?: number;
	currency?: string;
};

export type DisputeListResponse = {
	data: DisputeListItem[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
};

export type FetchDisputeListParams = {
	address?: string;
	page?: number;
	limit?: number;
};

export const fetchDisputeList = async (
	params: FetchDisputeListParams,
): Promise<DisputeListResponse> => {
	return request<DisputeListResponse>({
		url: "/dao/disputes",
		method: "GET",
		params,
	});
};

export type DisputeDetailResponse = {
	dispute?: Dispute;
	votes: Vote[];
};

export const fetchDisputeDetail = async (
	id: string,
): Promise<DisputeDetailResponse> => {
	return request<DisputeDetailResponse>({
		url: `/dao/${id}`,
		method: "GET",
	});
};

export type InitiateDisputePayload = {
	jobId: string;
	escrowId?: string;
	initiator: string;
	reason?: string;
};

export const initiateDispute = async (
	payload: InitiateDisputePayload,
): Promise<Dispute> => {
	return request<Dispute>({
		url: "/dao/initiate",
		method: "POST",
		data: payload,
	});
};

export type VoteDisputePayload = {
	disputeId: string;
	voter: string;
	vote: VoteValue;
	weight?: number;
};

export const voteDispute = async (
	payload: VoteDisputePayload,
): Promise<Dispute> => {
	return request<Dispute>({
		url: "/dao/vote",
		method: "POST",
		data: payload,
	});
};
