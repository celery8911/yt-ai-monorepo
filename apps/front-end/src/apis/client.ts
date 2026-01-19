import { setHttpClientOptions, request } from "@yt/libs/http";

setHttpClientOptions({
	baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api",
});

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
	list: async (params?: { role?: "payee" | "payer"; address?: string }): Promise<Bill[]> => {
		const searchParams = new URLSearchParams();
		if (params?.role) searchParams.append("role", params.role);
		if (params?.address) searchParams.append("address", params.address);

		const query = searchParams.toString();
		return request<Bill[]>({
			method: "GET",
			url: `/bills${query ? `?${query}` : ""}`,
		});
	},

	/**
	 * Get a single bill by ID
	 * @param id Bill ID
	 */
	getById: async (id: string): Promise<Bill> => {
		return request<Bill>({
			method: "GET",
			url: `/bills/${id}`,
		});
	},
};
