import { request } from "@yt/libs/http";

export type AgentListItem = {
  id: string;
  name: string;
  category: string;
  price?: string;
};

type BackendAgent = {
  id: string;
  name: string;
  category?: string;
  pricePerTask?: number;
  resultBasedMinPrice?: number;
  minBid?: number;
  currency?: string;
};

export type AgentListResponse = {
  items: AgentListItem[];
};

const formatPrice = (agent: BackendAgent): string | undefined => {
  const price =
    agent.pricePerTask ?? agent.resultBasedMinPrice ?? agent.minBid;
  if (price === undefined) return undefined;
  if (agent.currency) return `${price} ${agent.currency}`;
  return `${price}`;
};

export const fetchAgentList = async (): Promise<AgentListResponse> => {
  const data = await request<BackendAgent[]>({
    url: "/agents",
    method: "GET",
  });

  return {
    items: data.map((agent) => ({
      id: agent.id,
      name: agent.name,
      category: agent.category ?? "其他",
      price: formatPrice(agent),
    })),
  };
};
