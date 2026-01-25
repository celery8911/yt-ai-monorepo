import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { weatherWorkflow } from "./workflows/weather-workflow";
import { draftWorkflow } from "./workflows/draft-workflow";
import { weatherAgent } from "./agents/weather-agent";
import { draftAgent } from "./agents/draft-agent";
import {
	toolCallAppropriatenessScorer,
	completenessScorer,
	translationScorer,
} from "./scorers/weather-scorer";

export const mastra = new Mastra({
	workflows: { weatherWorkflow, draftWorkflow }, // 注册天气相关工作流（中文：天气流程）
	agents: { weatherAgent, draftAgent }, // 注册天气智能体，负责与模型交互
	scorers: {
		toolCallAppropriatenessScorer,
		completenessScorer,
		translationScorer,
	}, // 注册评估器：工具调用合理性、回答完整性、翻译质量
	storage: new LibSQLStore({
		// stores observability, scores, ... into memory storage, if it needs to persist, change to file:../mastra.db
		// 将观测数据、评分等存入内存；若需持久化可改为 file:../mastra.db
		url: ":memory:",
	}),
	logger: new PinoLogger({
		name: "Mastra", // 日志实例名称
		level: "info", // 默认日志级别，生产环境可调高
	}),
	telemetry: {
		// Telemetry is deprecated and will be removed in the Nov 4th release
		// 遥测功能即将废弃，并将在 11 月 4 日的版本中移除
		enabled: false,
	},
	observability: {
		// Enables DefaultExporter and CloudExporter for AI tracing
		// 启动默认导出与云端导出，用于 AI Trace 观测
		default: { enabled: true },
	},
});
