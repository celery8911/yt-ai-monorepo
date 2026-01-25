import { request } from "@yt/libs/http";

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
	return request<AgentProxyResponse>({
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
