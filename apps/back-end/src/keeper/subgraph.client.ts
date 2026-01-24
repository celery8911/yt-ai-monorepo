import { logError } from "./logger";

type GraphResponse<T> = { data?: T; errors?: Array<{ message: string }> };

type GraphQuery<TVars extends Record<string, unknown>> = {
	query: string;
	variables: TVars;
};

export async function querySubgraph<
	TVars extends Record<string, unknown>,
	TResult,
>(url: string, payload: GraphQuery<TVars>): Promise<TResult> {
	const res = await fetch(url, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(payload),
	});

	if (!res.ok) {
		throw new Error(`Subgraph request failed: ${res.status} ${res.statusText}`);
	}

	const json = (await res.json()) as GraphResponse<TResult>;
	if (json.errors?.length) {
		logError(
			`Subgraph errors: ${json.errors.map((e) => e.message).join("; ")}`,
		);
		throw new Error("Subgraph returned errors");
	}

	if (!json.data) {
		throw new Error("Subgraph returned empty data");
	}

	return json.data;
}
