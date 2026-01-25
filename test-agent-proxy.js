// 运行方式: node test-agent-proxy.js
// 确保后端服务已启动 (localhost:4000)

async function testAgentProxy() {
	const backendUrl = "http://localhost:4000";
	// 替换为你想要测试的 Agent ID
	// const agentId = 'xhsAgent_deepseek_v3';
	const agentId = "weatherAgent";
	const url = `${backendUrl}/api/agent-proxy/${agentId}/generate`;

	console.log(`Testing Agent Proxy: ${url}`);
	console.log("Sending request...");

	try {
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				messages: [
					{
						role: "user",
						content:
							"帮我写一篇关于如果不写代码只用AI的话，我能不能开发出一个应用？",
					},
				],
			}),
		});

		console.log(`Response Status: ${response.status}`);

		if (!response.ok) {
			const errorText = await response.text();
			console.error("Error Response:", errorText);
			return;
		}

		const data = await response.json();
		console.log("Response Data:", JSON.stringify(data, null, 2));
	} catch (error) {
		console.error("Test Failed:", error.message);
		if (error.cause) {
			console.error("Cause:", error.cause);
		}
	}
}

testAgentProxy();
