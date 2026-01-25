/**
 * Mastra API 调用示例脚本
 * 用于调用 weatherAgent 和 weatherWorkflow
 */

const BASE_URL = "http://localhost:4111";

/**
 * 调用 weatherAgent 生成响应
 */
async function callWeatherAgent(city) {
	try {
		const response = await fetch(
			`${BASE_URL}/api/agents/weatherAgent/generate`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					messages: [
						{
							role: "user",
							content: `请告诉我${city}的天气怎么样？`,
						},
					],
				}),
			},
		);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();
		return result;
	} catch (error) {
		console.error("调用 weatherAgent 失败:", error);
		throw error;
	}
}

/**
 * 调用 weatherAgent 流式响应
 */
async function callWeatherAgentStream(city) {
	try {
		const response = await fetch(`${BASE_URL}/api/agents/weatherAgent/stream`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				messages: [
					{
						role: "user",
						content: `请告诉我${city}的天气怎么样？`,
					},
				],
			}),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		// 读取流式响应
		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let fullText = "";

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			const chunk = decoder.decode(value, { stream: true });
			const lines = chunk.split("\n");

			for (const line of lines) {
				if (line.startsWith("data: ")) {
					const data = line.slice(6);
					if (data === "[DONE]") continue;
					try {
						const parsed = JSON.parse(data);
						if (parsed.content) {
							fullText += parsed.content;
							process.stdout.write(parsed.content);
						}
					} catch (e) {
						// 忽略解析错误
					}
				}
			}
		}

		console.log("\n");
		return fullText;
	} catch (error) {
		console.error("调用 weatherAgent stream 失败:", error);
		throw error;
	}
}

/**
 * 启动 weatherWorkflow
 */
async function startWeatherWorkflow(city) {
	try {
		const response = await fetch(
			`${BASE_URL}/api/workflows/weatherWorkflow/start`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					inputData: {
						city: city,
					},
				}),
			},
		);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();
		return result;
	} catch (error) {
		console.error("启动 weatherWorkflow 失败:", error);
		throw error;
	}
}

/**
 * 获取所有可用的 agents
 */
async function getAllAgents() {
	try {
		const response = await fetch(`${BASE_URL}/api/agents`);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const result = await response.json();
		return result;
	} catch (error) {
		console.error("获取 agents 列表失败:", error);
		throw error;
	}
}

/**
 * 获取所有可用的 workflows
 */
async function getAllWorkflows() {
	try {
		const response = await fetch(`${BASE_URL}/api/workflows`);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const result = await response.json();
		return result;
	} catch (error) {
		console.error("获取 workflows 列表失败:", error);
		throw error;
	}
}

/**
 * 获取特定 agent 的详细信息
 */
async function getAgentDetails(agentId) {
	try {
		const response = await fetch(`${BASE_URL}/api/agents/${agentId}`);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const result = await response.json();
		return result;
	} catch (error) {
		console.error("获取 agent 详情失败:", error);
		throw error;
	}
}

// ============ 测试函数 ============

async function testAllAPIs() {
	// 4. 调用 weatherAgent (北京)
	console.log("\n4. 调用 weatherAgent - 查询北京天气:");
	const result1 = await callWeatherAgent("北京");
	console.log(JSON.stringify(result1, null, 2));
}

// 运行测试
// if (import.meta.url === `file://${process.argv[1]}`) {
testAllAPIs().catch(console.error);
// }

// 导出函数供其他模块使用
export {
	callWeatherAgent,
	callWeatherAgentStream,
	startWeatherWorkflow,
	getAllAgents,
	getAllWorkflows,
	getAgentDetails,
};
