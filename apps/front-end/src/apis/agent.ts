import { request } from "@yt/libs/http";

export type AgentListItem = {
  id: string;
  name: string;
  category: string;
  rating?: number;
  price?: string;
  desc?: string;
  tags: string[];
  // 后端特有字段
  skillLevel?: string;
  successRate?: number;
  visibility?: string;
  isActive?: boolean;
};

type BackendAgent = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  pricePerTask?: number;
  resultBasedMinPrice?: number;
  minBid?: number;
  currency?: string;
  rating?: number;
  skillLevel?: string;
  successRate?: number;
  visibility?: string;
  isActive?: boolean;
};

export type AgentListResponse = {
  items: AgentListItem[];
};

export type CategoriesResponse = {
  categories: Array<{ id: string; label: string }>;
};

const formatPrice = (agent: BackendAgent): string | undefined => {
  const price =
    agent.pricePerTask ?? agent.resultBasedMinPrice ?? agent.minBid;
  if (price === undefined) return undefined;
  if (agent.currency) return `${price} ${agent.currency}`;
  return `${price}`;
};

export type FetchAgentListParams = {
  category?: string;
  tag?: string;
  paymentMethod?: string;
  skillLevel?: string;
  isActive?: boolean;
  visibility?: "public" | "private";
  search?: string;
};

export const fetchAgentList = async (
  params?: FetchAgentListParams
): Promise<AgentListResponse> => {
  const queryParams = new URLSearchParams();

  if (params?.category) {
    queryParams.append("category", params.category);
  }
  if (params?.tag) {
    queryParams.append("tag", params.tag);
  }
  if (params?.paymentMethod) {
    queryParams.append("paymentMethod", params.paymentMethod);
  }
  if (params?.skillLevel) {
    queryParams.append("skillLevel", params.skillLevel);
  }
  if (params?.isActive !== undefined) {
    queryParams.append("isActive", String(params.isActive));
  }
  if (params?.visibility) {
    queryParams.append("visibility", params.visibility);
  }
  if (params?.search) {
    queryParams.append("search", params.search);
  }

  const url = queryParams.toString()
    ? `/agents?${queryParams.toString()}`
    : "/agents";

  const data = await request<BackendAgent[]>({
    url,
    method: "GET",
  });

  return {
    items: data.map((agent) => ({
      id: agent.id,
      name: agent.name,
      category: agent.category ?? "其他",
      rating: agent.rating,
      price: formatPrice(agent),
      desc: agent.description,
      tags: agent.tags ?? [],
      skillLevel: agent.skillLevel,
      successRate: agent.successRate,
      visibility: agent.visibility,
      isActive: agent.isActive,
    })),
  };
};

export const fetchCategories = async (): Promise<CategoriesResponse> => {
  const data = await request<Array<{ id: string; label: string }>>({
    url: "/agents/categories",
    method: "GET",
  });

  return { categories: data };
};
