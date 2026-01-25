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
