import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { buildDraftPrompt, getDraftSchema } from "../prompts/draft-prompt";

const inputSchema = z.object({
	text: z.string().min(1),
	draftType: z.enum(["agent", "job"]).optional(),
	createdBy: z.string().optional(),
	owner: z.string().optional(),
});

const outputSchema = getDraftSchema();

type DraftPayload = {
	draftType?: "job" | "agent";
	fields?: Record<string, unknown>;
	confidence?: Record<string, unknown>;
	notes?: unknown;
	missing?: unknown;
};

const extractStringValue = (value: unknown): string | undefined => {
	if (typeof value === "string") return value;
	if (!value || typeof value !== "object") return undefined;
	const record = value as { value?: unknown; label?: unknown; name?: unknown };
	if (typeof record.value === "string") return record.value;
	if (typeof record.label === "string") return record.label;
	if (typeof record.name === "string") return record.name;
	return undefined;
};

const mapPaymentMethod = (value: unknown) => {
	const raw = extractStringValue(value);
	if (!raw) return value;
	const normalized = raw.trim().toUpperCase();
	const map: Record<string, string> = {
		FREE: "FREE",
		免费: "FREE",
		PER_TASK: "PER_TASK",
		按任务: "PER_TASK",
		HUMAN_HIRING: "HUMAN_HIRING",
		人工雇佣: "HUMAN_HIRING",
		RESULT_BASED: "RESULT_BASED",
		结果付费: "RESULT_BASED",
	};
	return map[normalized] ?? map[raw] ?? raw;
};

const mapSkillLevel = (value: unknown) => {
	const raw = extractStringValue(value);
	if (!raw) return value;
	const normalized = raw.trim().toUpperCase();
	const map: Record<string, string> = {
		BEGINNER: "BEGINNER",
		新手: "BEGINNER",
		INTERMEDIATE: "INTERMEDIATE",
		中级: "INTERMEDIATE",
		ADVANCED: "ADVANCED",
		高级: "ADVANCED",
		EXPERT: "EXPERT",
		专家: "EXPERT",
	};
	return map[normalized] ?? map[raw] ?? raw;
};

const mapPriority = (value: unknown) => {
	const raw = extractStringValue(value);
	if (!raw) return value;
	const normalized = raw.trim().toUpperCase();
	const map: Record<string, string> = {
		LOW: "LOW",
		低: "LOW",
		MEDIUM: "MEDIUM",
		中: "MEDIUM",
		中等: "MEDIUM",
		HIGH: "HIGH",
		高: "HIGH",
		URGENT: "URGENT",
		紧急: "URGENT",
	};
	return map[normalized] ?? map[raw] ?? raw;
};

const mapVisibility = (value: unknown) => {
	const raw = extractStringValue(value);
	if (!raw) return value;
	const normalized = raw.trim().toLowerCase();
	if (normalized === "公开") return "public";
	if (normalized === "私密") return "private";
	return raw;
};

const mapPayoutStrategy = (value: unknown) => {
	const raw = extractStringValue(value);
	if (!raw) return value;
	const normalized = raw.trim().toUpperCase();
	const map: Record<string, string> = {
		WINNER_TAKE_ALL: "WINNER_TAKE_ALL",
		优胜者获得全部: "WINNER_TAKE_ALL",
		SPLIT_IF_NO_SELECTION: "SPLIT_IF_NO_SELECTION",
		未选中则拆分: "SPLIT_IF_NO_SELECTION",
	};
	return map[normalized] ?? map[raw] ?? raw;
};

const ensureEnum = (value: unknown, allowed: Set<string>) => {
	if (typeof value !== "string") return undefined;
	return allowed.has(value) ? value : undefined;
};

const normalizeConfidence = (value: unknown) => {
	if (!value || typeof value !== "object") return value;
	const record = value as Record<string, unknown>;
	const normalized: Record<string, number> = {};
	for (const [key, entry] of Object.entries(record)) {
		if (typeof entry === "number") {
			normalized[key] = entry;
			continue;
		}
		if (typeof entry === "string") {
			const parsed = Number(entry);
			if (Number.isFinite(parsed)) {
				normalized[key] = parsed;
			}
			continue;
		}
		if (entry && typeof entry === "object") {
			const maybeScore =
				(entry as { score?: unknown; confidence?: unknown }).score ??
				(entry as { confidence?: unknown }).confidence;
			if (typeof maybeScore === "number" && Number.isFinite(maybeScore)) {
				normalized[key] = maybeScore;
				continue;
			}
			if (typeof maybeScore === "string") {
				const parsed = Number(maybeScore);
				if (Number.isFinite(parsed)) {
					normalized[key] = parsed;
				}
			}
		}
	}
	return normalized;
};

const normalizeDraft = (value: unknown) => {
	if (!value || typeof value !== "object") return value;
	const draft = value as DraftPayload;
	const fields = draft.fields ? { ...draft.fields } : {};
	const draftType =
		typeof draft.draftType === "string"
			? (draft.draftType.toLowerCase() as "job" | "agent")
			: draft.draftType;

	if (draftType === "job" || "paymentMethod" in fields) {
		fields.paymentMethod = ensureEnum(
			mapPaymentMethod(fields.paymentMethod),
			new Set(["FREE", "PER_TASK", "HUMAN_HIRING", "RESULT_BASED"]),
		);
		fields.requiredSkillLevel = ensureEnum(
			mapSkillLevel(fields.requiredSkillLevel),
			new Set(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]),
		);
		fields.priority = ensureEnum(
			mapPriority(fields.priority),
			new Set(["LOW", "MEDIUM", "HIGH", "URGENT"]),
		);
		fields.visibility = ensureEnum(
			mapVisibility(fields.visibility),
			new Set(["public", "private"]),
		);
		fields.payoutStrategy = ensureEnum(
			mapPayoutStrategy(fields.payoutStrategy),
			new Set(["WINNER_TAKE_ALL", "SPLIT_IF_NO_SELECTION"]),
		);
	}

	return {
		...draft,
		draftType,
		fields,
		confidence: normalizeConfidence(draft.confidence) ?? {},
	};
};

function inferDraftType(text: string): "agent" | "job" {
	const normalized = text.toLowerCase();
	if (normalized.includes("agent")) {
		return "agent";
	}
	if (normalized.includes("job")) {
		return "job";
	}
	return "job";
}

function extractJson(text: string): string {
	const trimmed = text.trim();
	if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
		return trimmed;
	}

	const start = trimmed.indexOf("{");
	const end = trimmed.lastIndexOf("}");
	if (start === -1 || end === -1 || end <= start) {
		return trimmed;
	}

	return trimmed.slice(start, end + 1);
}

const generateDraft = createStep({
	id: "generate-draft",
	description: "Generate an agent/job draft from natural language input",
	inputSchema,
	outputSchema,
	execute: async ({ inputData, mastra }) => {
		if (!inputData) {
			throw new Error("Input data not found");
		}
		if (!process.env.OPENAI_API_KEY) {
			throw new Error("OPENAI_API_KEY is not set");
		}

		const agent = mastra?.getAgent("draftAgent");
		if (!agent) {
			throw new Error("Draft agent not found");
		}

		const draftType = inputData.draftType ?? inferDraftType(inputData.text);
		const prompt = buildDraftPrompt({ ...inputData, draftType });
		const response = await agent.stream([
			{
				role: "user",
				content: prompt,
			},
		]);

		let outputText = "";
		for await (const chunk of response.textStream) {
			outputText += chunk;
		}

		if (!outputText.trim()) {
			throw new Error("LLM returned empty response");
		}

		const jsonText = extractJson(outputText);
		let parsed: unknown;
		try {
			parsed = JSON.parse(jsonText);
		} catch (error) {
			const preview = outputText.trim().slice(0, 200);
			throw new Error(
				`Failed to parse JSON: ${String(error)} | preview: ${preview}`,
			);
		}

		const normalized = normalizeDraft(parsed);
		try {
			return outputSchema.parse(normalized);
		} catch {
			// Fallback: return normalized draft with safe defaults to avoid hard failure.
			const fallback = normalized as DraftPayload;
			return {
				draftType: fallback.draftType ?? "job",
				fields: fallback.fields ?? {},
				missing: Array.isArray(fallback.missing) ? fallback.missing : [],
				confidence:
					fallback.confidence && typeof fallback.confidence === "object"
						? fallback.confidence
						: {},
				notes: Array.isArray(fallback.notes) ? fallback.notes : [],
			};
		}
	},
});

const draftWorkflow = createWorkflow({
	id: "draft-workflow",
	inputSchema,
	outputSchema,
}).then(generateDraft);

draftWorkflow.commit();

export { draftWorkflow };
