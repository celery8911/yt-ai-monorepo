import { Args, Query, Resolver } from "@nestjs/graphql";
import {
	AgentPerformanceType,
	DashboardOverviewType,
	JobTrendType,
} from "./dashboard.model";
import { DashboardService } from "./dashboard.service";

@Resolver(() => DashboardOverviewType)
export class DashboardResolver {
	constructor(private readonly dashboardService: DashboardService) {}

	@Query(() => DashboardOverviewType)
	async dashboardOverview(
		@Args("agentAddress", { nullable: true }) agentAddress?: string,
		@Args("userAddress", { nullable: true }) userAddress?: string,
	) {
		return this.dashboardService.overview(agentAddress, userAddress);
	}

	@Query(() => [AgentPerformanceType])
	async dashboardAgentPerformance() {
		return this.dashboardService.agentPerformance();
	}

	@Query(() => [JobTrendType])
	async dashboardJobTrends() {
		return this.dashboardService.jobTrends();
	}
}
