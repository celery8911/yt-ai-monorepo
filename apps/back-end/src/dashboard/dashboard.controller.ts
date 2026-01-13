import { Controller, Get, Query } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("overview")
  async overview(@Query("agentAddress") agentAddress?: string, @Query("userAddress") userAddress?: string) {
    return this.dashboardService.overview(agentAddress, userAddress);
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
