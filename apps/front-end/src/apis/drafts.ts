import { request } from "@yt/libs/http";

export type JobDraftFields = Partial<{
	title: string;
	description: string;
	category: string;
	tags: string[];
	paymentMethod: "FREE" | "PER_TASK" | "HUMAN_HIRING" | "RESULT_BASED";
	budgetMin: number;
	budgetMax: number;
	currency: string;
	requiredSkillLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
	deliverables: string;
	acceptanceCriteria: string;
	deadlineAt: string;
	priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
	autoMatchEnabled: boolean;
	biddingEnabled: boolean;
	escrowEnabled: boolean;
	visibility: "public" | "private";
	reviewWindowDays: number;
	payoutStrategy: "WINNER_TAKE_ALL" | "SPLIT_IF_NO_SELECTION";
	status: "DRAFT" | "OPEN";
	createdBy: string;
}>;

export type JobDraftResponse = {
	draftType: "job";
	fields?: JobDraftFields;
	missing?: string[];
	notes?: string[];
};

export type CreateJobDraftPayload = {
	text: string;
	draftType?: "job";
	createdBy?: string;
};

const getAgentsBaseUrl = () =>
	process.env.NEXT_PUBLIC_AGENTS_BASE_URL ?? "http://localhost:4111";

const getDraftEndpointPath = () =>
	process.env.NEXT_PUBLIC_AGENTS_DRAFT_ENDPOINT;

const defaultDraftPaths = ["/api/workflows/draftWorkflow/start-async"];

const isNotFoundError = (error: unknown): boolean => {
	if (!error || typeof error !== "object") return false;
	const response = (error as { response?: { status?: number } }).response;
	return response?.status === 404;
};

export const createJobDraft = async (
	payload: CreateJobDraftPayload,
): Promise<JobDraftResponse> => {
	const baseURL = getAgentsBaseUrl();
	const configuredPath = getDraftEndpointPath();
	const paths = configuredPath ? [configuredPath] : defaultDraftPaths;
	const bodyVariants = [
		{ inputData: payload, resourceId: payload.createdBy ?? "" },
		{ inputData: payload },
		{ input: payload },
		payload,
	];

	let lastError: unknown;
	for (const path of paths) {
		for (const data of bodyVariants) {
			try {
				const response = await request<{ result?: JobDraftResponse }>(
					{
						method: "POST",
						url: path,
						data,
					},
					{ baseURL },
				);

				return response.result ?? response;
			} catch (error) {
				lastError = error;
				if (isNotFoundError(error)) {
					break;
				}
			}
		}
	}

	throw lastError ?? new Error("Draft endpoint not found");
};
