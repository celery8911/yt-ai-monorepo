import { request } from "@yt/libs/http";
import type {
	DashboardStatsResponse,
	DisputeItem,
	PaginatedResponse,
	PublishedAgentItem,
	PublishedJobItem,
	SignedAgentItem,
} from "./dashboard.types";

type PaginationParams = {
	page?: number;
	limit?: number;
};

export const fetchDashboardStats = async (
	address: string,
): Promise<DashboardStatsResponse> => {
	return request<DashboardStatsResponse>(
		{
			url: "/dashboard/stats",
			method: "GET",
			params: { address },
		},
		{ timeout: 20000 },
	);
};

export const fetchPublishedJobs = async (
	address: string,
	pagination: PaginationParams = {},
): Promise<PaginatedResponse<PublishedJobItem>> => {
	return request<PaginatedResponse<PublishedJobItem>>({
		url: "/dashboard/published-jobs",
		method: "GET",
		params: { address, ...pagination },
	});
};

export const fetchPublishedAgents = async (
	address: string,
	pagination: PaginationParams = {},
): Promise<PaginatedResponse<PublishedAgentItem>> => {
	return request<PaginatedResponse<PublishedAgentItem>>({
		url: "/dashboard/published-agents",
		method: "GET",
		params: { address, ...pagination },
	});
};

export const fetchSignedAgents = async (
	address: string,
	pagination: PaginationParams = {},
): Promise<PaginatedResponse<SignedAgentItem>> => {
	return request<PaginatedResponse<SignedAgentItem>>({
		url: "/dashboard/signed-agents",
		method: "GET",
		params: { address, ...pagination },
	});
};

export const fetchDisputes = async (
	address: string,
	pagination: PaginationParams = {},
): Promise<PaginatedResponse<DisputeItem>> => {
	return request<PaginatedResponse<DisputeItem>>({
		url: "/dao/disputes",
		method: "GET",
		params: { address, ...pagination },
	});
};
