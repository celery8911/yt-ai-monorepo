// 导入 Mastra 核心 Agent 类
import { Agent } from "@mastra/core/agent";
// 导入记忆模块，用于存储对话历史
import { Memory } from "@mastra/memory";
// 导入 LibSQL 存储适配器
import { LibSQLStore } from "@mastra/libsql";
// 导入天气工具
import { weatherWorkflowTool } from "../tools/weather-workflow-tool";
import { scorers } from "../scorers/weather-scorer";

// 创建天气助手 Agent
export const weatherAgent = new Agent({
	// Agent 名称
	name: "Weather Agent",
	// Agent 指令，定义其行为和职责
	instructions: `
      You are a helpful weather assistant that provides accurate weather information and can help planning activities based on the weather.

      Your primary function is to help users get weather details for specific locations. When responding:
      - Always ask for a location if none is provided
      - If the location name isn't in English, please translate it
      - If giving a location with multiple parts (e.g. "New York, NY"), use the most relevant part (e.g. "New York")
      - Include relevant details like humidity, wind conditions, and precipitation
      - Keep responses concise but informative
      - If the user asks for activities and provides the weather forecast, suggest activities based on the weather forecast.
      - If the user asks for activities, respond in the format they request.

      Use the weatherWorkflowTool to fetch current weather data.
`,
	// 使用的 AI 模型
	model: process.env.MODEL_NAME || "iflowcn/glm-4.6",
	// Agent 可使用的工具集合
	tools: { weatherWorkflowTool },
	// 评分器配置，用于评估 Agent 性能
	scorers: {
		// 工具调用适当性评分器
		toolCallAppropriateness: {
			scorer: scorers.toolCallAppropriatenessScorer,
			// 采样配置：100% 采样率
			sampling: {
				type: "ratio",
				rate: 1,
			},
		},
		// 完整性评分器
		completeness: {
			scorer: scorers.completenessScorer,
			// 采样配置：100% 采样率
			sampling: {
				type: "ratio",
				rate: 1,
			},
		},
		// 翻译准确性评分器
		translation: {
			scorer: scorers.translationScorer,
			// 采样配置：100% 采样率
			sampling: {
				type: "ratio",
				rate: 1,
			},
		},
	},
	// 记忆配置，用于保存对话上下文
	memory: new Memory({
		storage: new LibSQLStore({
			// 数据库文件路径（相对于 .mastra/output 目录）
			url: "file:../mastra.db",
		}),
	}),
});
