import { Controller, Post, Body, Param, Req } from "@nestjs/common";
import { AgentProxyService } from "./agent-proxy.service";
import { Request } from "express";

@Controller("agent-proxy")
export class AgentProxyController {
	constructor(private readonly agentProxyService: AgentProxyService) {}

	// 预留鉴权位置
	// @UseGuards(JwtAuthGuard)
	@Post(":agentId/generate")
	async generate(
		@Param("agentId") agentId: string,
		@Body() body: any,
		@Req() req: Request,
	) {
		return this.agentProxyService.proxyRequest(
			"POST",
			`/api/agents/${agentId}/generate`,
			body,
			req.headers,
		);
	}
}
