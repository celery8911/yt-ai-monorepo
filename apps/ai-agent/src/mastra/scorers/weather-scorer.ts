import { z } from "zod";
import { createToolCallAccuracyScorerCode } from "@mastra/evals/scorers/code";
import { createCompletenessScorer } from "@mastra/evals/scorers/code";
import { createScorer } from "@mastra/core/scores";

// 工具调用准确性评分：判断是否正确调用 weatherTool
export const toolCallAppropriatenessScorer = createToolCallAccuracyScorerCode({
	expectedTool: "weatherTool",
	strictMode: false,
});

// 回答完整性评分：确认回复涵盖关键信息
export const completenessScorer = createCompletenessScorer();

// LLM 评审：检测非英语地名是否被正确翻译
export const translationScorer = createScorer({
	name: "Translation Quality",
	description:
		"Checks that non-English location names are translated and used correctly",
	type: "agent",
	judge: {
		model: process.env.MODEL_NAME || "iflowcn/glm-4.6",
		instructions:
			"You are an expert evaluator of translation quality for geographic locations. " +
			"Determine whether the user text mentions a non-English location and whether the assistant correctly uses an English translation of that location. " +
			"Be lenient with transliteration differences and diacritics. " +
			"Return only the structured JSON matching the provided schema.",
	},
})
	.preprocess(({ run }) => {
		// 预处理：提取用户与助手文本，供后续提示使用
		const userText = (run.input?.inputMessages?.[0]?.content as string) || "";
		const assistantText = (run.output?.[0]?.content as string) || "";
		return { userText, assistantText };
	})
	.analyze({
		// 分析步骤：让 LLM 抽取地名并判断是否为非英语与翻译情况
		description:
			"Extract location names and detect language/translation adequacy",
		outputSchema: z.object({
			nonEnglish: z.boolean(),
			translated: z.boolean(),
			confidence: z.number().min(0).max(1).default(1),
			explanation: z.string().default(""),
		}),
		createPrompt: ({ results }) => `
            You are evaluating if a weather assistant correctly handled translation of a non-English location.
            User text:
            """
            ${results.preprocessStepResult.userText}
            """
            Assistant response:
            """
            ${results.preprocessStepResult.assistantText}
            """
            Tasks:
            1) Identify if the user mentioned a location that appears non-English.
            2) If non-English, check whether the assistant used a correct English translation of that location in its response.
            3) Be lenient with transliteration differences (e.g., accents/diacritics).
            Return JSON with fields:
            {
            "nonEnglish": boolean,
            "translated": boolean,
            "confidence": number, // 0-1
            "explanation": string
            }
        `, // 构造提示：提供原始问答供 LLM 评估翻译
	})
	.generateScore(({ results }) => {
		const r = (results as any)?.analyzeStepResult || {};
		if (!r.nonEnglish) return 1; // 若无非英语地名，直接满分
		if (r.translated)
			return Math.max(0, Math.min(1, 0.7 + 0.3 * (r.confidence ?? 1)));
		return 0; // 存在非英语地名但未翻译
	})
	.generateReason(({ results, score }) => {
		// 生成可读原因，方便在观测中追踪得分依据
		const r = (results as any)?.analyzeStepResult || {};
		return `Translation scoring: nonEnglish=${
			r.nonEnglish ?? false
		}, translated=${r.translated ?? false}, confidence=${
			r.confidence ?? 0
		}. Score=${score}. ${r.explanation ?? ""}`;
	});

export const scorers = {
	toolCallAppropriatenessScorer,
	completenessScorer,
	translationScorer,
};
