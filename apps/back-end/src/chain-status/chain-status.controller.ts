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

	@Get("engagement/by-id")
	async getEngagementById(@Query("id") id?: string) {
		if (!id) {
			throw new BadRequestException("id is required");
		}
		return this.chainStatusService.getEngagementById(id);
	}

	@Get("engagement/by-user")
	async getEngagementsByUser(
		@Query("user") user?: string,
		@Query("first") first?: string,
		@Query("skip") skip?: string,
	) {
		if (!user) {
			throw new BadRequestException("user is required");
		}
		const options = {
			first: first ? Number.parseInt(first, 10) : undefined,
			skip: skip ? Number.parseInt(skip, 10) : undefined,
		};
		return this.chainStatusService.getEngagementsByUser(user, options);
	}

	@Get("engagement/by-agent-id")
	async getEngagementsByAgentId(
		@Query("agentId") agentId?: string,
		@Query("first") first?: string,
		@Query("skip") skip?: string,
	) {
		if (!agentId) {
			throw new BadRequestException("agentId is required");
		}
		const options = {
			first: first ? Number.parseInt(first, 10) : undefined,
			skip: skip ? Number.parseInt(skip, 10) : undefined,
		};
		return this.chainStatusService.getEngagementsByAgentId(agentId, options);
	}

	@Get("engagement/by-owner")
	async getEngagementsByOwner(
		@Query("owner") owner?: string,
		@Query("first") first?: string,
		@Query("skip") skip?: string,
	) {
		if (!owner) {
			throw new BadRequestException("owner is required");
		}
		const options = {
			first: first ? Number.parseInt(first, 10) : undefined,
			skip: skip ? Number.parseInt(skip, 10) : undefined,
		};
		return this.chainStatusService.getEngagementsByOwner(owner, options);
	}

	@Get("escrow/by-payer")
	async getEscrowByPayer(
		@Query("payer") payer?: string,
		@Query("activeOnly") activeOnly?: string,
	) {
		if (!payer) {
			throw new BadRequestException("payer is required");
		}
		const activeOnlyFlag = activeOnly
			? activeOnly.toLowerCase() !== "false"
			: true;
		return this.chainStatusService.getEscrowsByPayer(payer, activeOnlyFlag);
	}
}
