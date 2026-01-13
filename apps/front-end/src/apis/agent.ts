import { request } from "@yt/libs/http";

export type AgentListItem = {
  id: string;
  name: string;
  category: string;
  price?: string;
};

export type AgentListResponse = {
  items: AgentListItem[];
};

export const fetchAgentList = async () =>
  request<AgentListResponse>({
    url: "/agents",
    method: "GET",
  });
