import { apiRequest } from "@/apis/client";

export type AgentProxyResponse = {
	status?: string;
	result?: unknown;
	data?: unknown;
	message?: string;
};

export const invokeAgentProxy = async (
	agentId: string,
	input: string,
): Promise<AgentProxyResponse> => {
	return apiRequest<AgentProxyResponse>({
		url: `/agent-proxy/${agentId}/generate`,
		method: "POST",
		data: {
			messages: [
				{
					role: "user",
					content: input,
				},
			],
		},
	});
};
