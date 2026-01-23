import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { ChainStatusService } from "./chain-status.service";

@Controller("chain-status")
export class ChainStatusController {
	constructor(private readonly chainStatusService: ChainStatusService) {}

	@Get("escrow/by-job")
	async getEscrowByJob(@Query("jobId") jobId?: string) {
		if (!jobId) {
			throw new BadRequestException("jobId is required");
		}
		return this.chainStatusService.getEscrowByJobId(jobId);
	}

	@Get("escrow/by-agent")
	async getEscrowByAgent(
		@Query("agent") agent?: string,
		@Query("activeOnly") activeOnly?: string,
	) {
		if (!agent) {
			throw new BadRequestException("agent is required");
		}
		const activeOnlyFlag = activeOnly
			? activeOnly.toLowerCase() !== "false"
			: true;
		return this.chainStatusService.getEscrowsByAgent(agent, activeOnlyFlag);
	}
}
