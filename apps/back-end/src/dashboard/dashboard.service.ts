import { Injectable } from "@nestjs/common";
import { AgentsService } from "../agents/agents.service";
import { JobsService } from "../jobs/jobs.service";
import { WalletService } from "../wallet/wallet.service";

@Injectable()
export class DashboardService {
  constructor(
    private readonly jobsService: JobsService,
    private readonly agentsService: AgentsService,
    private readonly walletService: WalletService
  ) {}

  async overview(agentAddress?: string, userAddress?: string) {
    const jobs = await this.jobsService.all();
    const agents = await this.agentsService.all();
    const escrows = await this.walletService.listEscrows();
    const totalEscrow = escrows.reduce((sum, escrow) => sum + escrow.amount, 0);
    const activeJobs = jobs.filter((job) => ["OPEN", "MATCHING", "IN_PROGRESS"].includes(job.status)).length;
    const completedJobs = jobs.filter((job) => job.status === "COMPLETED").length;
    const disputedJobs = jobs.filter((job) => job.status === "DISPUTED").length;

    const agentWallet = agentAddress ? await this.walletService.balance(agentAddress) : undefined;
    const userWallet = userAddress ? await this.walletService.balance(userAddress) : undefined;

    return {
      totalAgents: agents.length,
      totalJobs: jobs.length,
      totalEscrow,
      activeJobs,
      completedJobs,
      disputedJobs,
      myTotalEarnings: agentWallet?.totalEarnings ?? 0,
      mySuccessRate: agents.find((agent) => agent.owner === agentAddress)?.successRate ?? 0,
      myActiveJobs: jobs.filter((job) => job.selectedAgentId === agentAddress).length,
      myTotalSpent: userWallet?.totalSpent ?? 0,
      myPublishedJobs: jobs.filter((job) => job.createdBy === userAddress).length,
      myCompletedJobs: jobs.filter((job) => job.createdBy === userAddress && job.status === "COMPLETED").length
    };
  }

  async agentPerformance() {
    const agents = await this.agentsService.all();
    return agents.map((agent) => ({
      agentId: agent.id,
      earnings: Math.round((agent.successRate ?? 0.6) * 10000)
    }));
  }

  async jobTrends() {
    const jobs = await this.jobsService.all();
    const totals = new Map<string, number>();
    for (const job of jobs) {
      const date = job.createdAt.slice(0, 10);
      totals.set(date, (totals.get(date) ?? 0) + 1);
    }
    return Array.from(totals.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value }));
  }
}
