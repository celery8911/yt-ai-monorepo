import { request } from "@yt/libs/http";

export const API_BASE_PATH = "/api";

const serverApiBaseUrl = (
	process.env.API_PROXY_TARGET ??
	process.env.NEXT_PUBLIC_API_BASE_URL ??
	"http://localhost:4000/api"
).replace(/\/$/, "");

type ApiRequestConfig = Parameters<typeof request>[0];
type ApiRequestOptions = Omit<
	NonNullable<Parameters<typeof request>[1]>,
	"baseURL"
>;

const resolveApiBaseURL = () =>
	typeof window === "undefined" ? serverApiBaseUrl : API_BASE_PATH;

export const apiRequest = <T>(
	config: ApiRequestConfig,
	options: ApiRequestOptions = {},
) => {
	return request<T>(config, {
		...options,
		baseURL: resolveApiBaseURL(),
	});
};

// Types
export interface Bill {
	id: string;
	jobId: string;
	agentId: string;
	amount: number;
	currency: string;
	status: "PENDING" | "PAID" | "REFUNDED";
	escrowId?: string;
	payeeAddress: string;
	payerAddress: string;
	createdAt: string;
	paidAt?: string;
}

// Bills API
export const billsApi = {
	/**
	 * Get list of bills
	 * @param params Optional filters for role (payee/payer) and address
	 */
	list: async (params?: {
		role?: "payee" | "payer";
		address?: string;
	}): Promise<Bill[]> => {
		const searchParams = new URLSearchParams();
		if (params?.role) searchParams.append("role", params.role);
		if (params?.address) searchParams.append("address", params.address);

		const query = searchParams.toString();
		return apiRequest<Bill[]>({
			method: "GET",
			url: `/bills${query ? `?${query}` : ""}`,
		});
	},

	/**
	 * Get a single bill by ID
	 * @param id Bill ID
	 */
	getById: async (id: string): Promise<Bill> => {
		return apiRequest<Bill>({
			method: "GET",
			url: `/bills/${id}`,
		});
	},
};
