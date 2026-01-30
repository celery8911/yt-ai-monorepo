import { Controller, Post, Body, Get, Param } from "@nestjs/common";
import { EngagementsService } from "./engagements.service";
import { CreateEngagementDto } from "./engagements.dto";

@Controller("engagements")
export class EngagementsController {
	constructor(private readonly engagementsService: EngagementsService) {}

	@Post()
	async create(@Body() dto: CreateEngagementDto) {
		return this.engagementsService.create(dto);
	}

	@Get("user/:userId")
	async listByUser(@Param("userId") userId: string) {
		return this.engagementsService.listByUser(userId);
	}

	@Get("agent/:agentId")
	async listByAgent(@Param("agentId") agentId: string) {
		return this.engagementsService.listByAgent(agentId);
	}

	@Get(":escrowId")
	async findByEscrowId(@Param("escrowId") escrowId: string) {
		return this.engagementsService.findByEscrowId(escrowId);
	}
}
