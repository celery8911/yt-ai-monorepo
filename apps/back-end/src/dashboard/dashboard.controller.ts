import { Controller, Get, Query } from "@nestjs/common";
import { DashboardQueryDto } from "./dashboard.dto";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
export class DashboardController {
	constructor(private readonly dashboardService: DashboardService) {}

	@Get("overview")
	async overview(
		@Query("agentAddress") agentAddress?: string,
		@Query("userAddress") userAddress?: string,
	) {
		return this.dashboardService.overview(agentAddress, userAddress);
	}

	@Get("stats")
	async stats(@Query() query: DashboardQueryDto) {
		return this.dashboardService.getStats(query.address);
	}

	@Get("published-jobs")
	async publishedJobs(@Query() query: DashboardQueryDto) {
		return this.dashboardService.getPublishedJobs(
			query.address,
			query.page,
			query.limit,
		);
	}

	@Get("published-agents")
	async publishedAgents(@Query() query: DashboardQueryDto) {
		return this.dashboardService.getPublishedAgents(
			query.address,
			query.page,
			query.limit,
		);
	}

	@Get("signed-agents")
	async signedAgents(@Query() query: DashboardQueryDto) {
		return this.dashboardService.getSignedAgents(
			query.address,
			query.page,
			query.limit,
		);
	}

	@Get("disputes")
	async disputes(@Query() query: DashboardQueryDto) {
		return this.dashboardService.getDisputes(
			query.address,
			query.page,
			query.limit,
		);
	}

	@Get("agent-performance")
	async agentPerformance() {
		return this.dashboardService.agentPerformance();
	}

	@Get("job-trends")
	async jobTrends() {
		return this.dashboardService.jobTrends();
	}
}
