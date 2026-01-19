import { Injectable } from "@nestjs/common";
import { toNumber } from "../common/utils";
import { AgentsService } from "../agents/agents.service";
import { JobsService } from "../jobs/jobs.service";
import { PrismaService } from "../prisma/prisma.service";
import { WalletService } from "../wallet/wallet.service";

@Injectable()
export class DashboardService {
  private readonly useDatabase = Boolean(process.env.DATABASE_URL);

  constructor(
    private readonly jobsService: JobsService,
    private readonly agentsService: AgentsService,
    private readonly walletService: WalletService,
    private readonly prisma: PrismaService
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

  private buildPagination(page: number, limit: number, total: number) {
    return {
      page,
      limit,
      total
    };
  }

  async getStats(address: string) {
    const activeStatuses = ["OPEN", "MATCHING", "IN_PROGRESS"];
    if (!this.useDatabase) {
      const wallet = await this.walletService.balance(address);
      const jobs = await this.jobsService.all();
      const publishedJobs = jobs.filter((job) => job.createdBy === address);
      const agents = await this.agentsService.list({});
      const publishedAgentsCount = agents.filter((agent) => agent.owner === address).length;
      return {
        walletBalance: wallet.balance,
        lockedAmount: wallet.lockedAmount,
        totalEarnings: wallet.totalEarnings,
        totalSpent: wallet.totalSpent,
        publishedJobsCount: publishedJobs.length,
        activeJobsCount: publishedJobs.filter((job) => activeStatuses.includes(job.status)).length,
        completedJobsCount: publishedJobs.filter((job) => job.status === "COMPLETED").length,
        publishedAgentsCount,
        signedAgentsCount: publishedJobs.filter((job) => job.selectedAgentId).length,
        openDisputesCount: 0
      };
    }

    const wallet = await this.prisma.wallet.findUnique({ where: { address } });
    const publishedJobsCount = await this.prisma.job.count({ where: { createdBy: address } });
    const activeJobsCount = await this.prisma.job.count({
      where: { createdBy: address, status: { in: activeStatuses } }
    });
    const completedJobsCount = await this.prisma.job.count({
      where: { createdBy: address, status: "COMPLETED" }
    });
    const signedAgentsCount = await this.prisma.job.count({
      where: { createdBy: address, selectedAgentId: { not: null } }
    });
    const publishedAgentsCount = await this.prisma.agent.count({ where: { owner: address } });
    const jobIds = await this.prisma.job.findMany({ where: { createdBy: address }, select: { id: true } });
    const disputeOrFilters: Array<{ initiator?: string; jobId?: { in: string[] } }> = [{ initiator: address }];
    if (jobIds.length > 0) {
      disputeOrFilters.push({ jobId: { in: jobIds.map((job) => job.id) } });
    }
    const openDisputesCount = await this.prisma.dispute.count({
      where: { status: { in: ["OPEN", "VOTING"] }, OR: disputeOrFilters }
    });

    return {
      walletBalance: toNumber(wallet?.balance) ?? 0,
      lockedAmount: toNumber(wallet?.lockedAmount) ?? 0,
      totalEarnings: toNumber(wallet?.totalEarnings) ?? 0,
      totalSpent: toNumber(wallet?.totalSpent) ?? 0,
      publishedJobsCount,
      activeJobsCount,
      completedJobsCount,
      publishedAgentsCount,
      signedAgentsCount,
      openDisputesCount
    };
  }

  async getPublishedJobs(address: string, page = 1, limit = 10) {
    if (!this.useDatabase) {
      const jobs = await this.jobsService.all();
      const filtered = jobs.filter((job) => job.createdBy === address);
      const sorted = filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const start = (page - 1) * limit;
      const paged = sorted.slice(start, start + limit);
      const data = await Promise.all(
        paged.map(async (job) => {
          const selectedAgent = job.selectedAgentId
            ? await this.agentsService.findById(job.selectedAgentId)
            : undefined;
          return {
            id: job.id,
            title: job.title,
            status: job.status,
            category: job.category,
            budgetMin: job.budgetMin,
            budgetMax: job.budgetMax,
            currency: job.currency,
            priority: job.priority,
            bidsCount: 0,
            selectedAgentId: job.selectedAgentId,
            selectedAgentName: selectedAgent?.name,
            createdAt: job.createdAt,
            deadlineAt: job.deadlineAt
          };
        })
      );
      return { data, pagination: this.buildPagination(page, limit, filtered.length) };
    }

    const [jobs, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where: { createdBy: address },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.job.count({ where: { createdBy: address } })
    ]);
    if (jobs.length === 0) {
      return { data: [], pagination: this.buildPagination(page, limit, total) };
    }
    const jobIds = jobs.map((job) => job.id);
    const bidCounts = await this.prisma.bid.groupBy({
      by: ["jobId"],
      where: { jobId: { in: jobIds } },
      _count: { _all: true }
    });
    const selectedAgentIds = jobs.map((job) => job.selectedAgentId).filter(Boolean) as string[];
    const agents = selectedAgentIds.length
      ? await this.prisma.agent.findMany({ where: { id: { in: selectedAgentIds } } })
      : [];
    const agentNameById = new Map(agents.map((agent) => [agent.id, agent.name]));
    const bidCountByJob = new Map(bidCounts.map((bid) => [bid.jobId, bid._count._all]));
    const data = jobs.map((job) => ({
      id: job.id,
      title: job.title,
      status: job.status,
      category: job.category ?? undefined,
      budgetMin: toNumber(job.budgetMin),
      budgetMax: toNumber(job.budgetMax),
      currency: job.currency ?? undefined,
      priority: job.priority,
      bidsCount: bidCountByJob.get(job.id) ?? 0,
      selectedAgentId: job.selectedAgentId ?? undefined,
      selectedAgentName: job.selectedAgentId ? agentNameById.get(job.selectedAgentId) : undefined,
      createdAt: job.createdAt.toISOString(),
      deadlineAt: job.deadlineAt ? job.deadlineAt.toISOString() : undefined
    }));
    return { data, pagination: this.buildPagination(page, limit, total) };
  }

  async getPublishedAgents(address: string, page = 1, limit = 10) {
    if (!this.useDatabase) {
      const agents = await this.agentsService.list({});
      const ownedAgents = agents.filter((agent) => agent.owner === address);
      const jobs = await this.jobsService.all();
      const start = (page - 1) * limit;
      const paged = ownedAgents.slice(start, start + limit);
      const data = paged.map((agent) => {
        const agentJobs = jobs.filter((job) => job.selectedAgentId === agent.id);
        const activeJobsCount = agentJobs.filter((job) =>
          ["OPEN", "MATCHING", "IN_PROGRESS"].includes(job.status)
        ).length;
        const completedJobsCount = agentJobs.filter((job) => job.status === "COMPLETED").length;
        return {
          id: agent.id,
          name: agent.name,
          category: agent.category,
          isActive: agent.isActive,
          visibility: agent.visibility,
          skillLevel: agent.skillLevel,
          pricePerTask: agent.pricePerTask,
          currency: agent.currency,
          rating: agent.rating,
          successRate: agent.successRate,
          activeJobsCount,
          completedJobsCount,
          totalEarnings: 0,
          createdAt: new Date().toISOString()
        };
      });
      return { data, pagination: this.buildPagination(page, limit, ownedAgents.length) };
    }

    const [agents, total] = await this.prisma.$transaction([
      this.prisma.agent.findMany({
        where: { owner: address },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.agent.count({ where: { owner: address } })
    ]);
    if (agents.length === 0) {
      return { data: [], pagination: this.buildPagination(page, limit, total) };
    }
    const agentIds = agents.map((agent) => agent.id);
    const jobGroups = await this.prisma.job.groupBy({
      by: ["selectedAgentId", "status"],
      where: {
        selectedAgentId: { in: agentIds },
        status: { in: ["OPEN", "MATCHING", "IN_PROGRESS", "COMPLETED"] }
      },
      _count: { _all: true }
    });
    const billGroups = await this.prisma.bill.groupBy({
      by: ["agentId"],
      where: { agentId: { in: agentIds }, status: "PAID" },
      _sum: { amount: true }
    });
    const activeJobsByAgent = new Map<string, number>();
    const completedJobsByAgent = new Map<string, number>();
    for (const group of jobGroups) {
      if (!group.selectedAgentId) continue;
      if (group.status === "COMPLETED") {
        completedJobsByAgent.set(group.selectedAgentId, group._count._all);
      } else {
        activeJobsByAgent.set(
          group.selectedAgentId,
          (activeJobsByAgent.get(group.selectedAgentId) ?? 0) + group._count._all
        );
      }
    }
    const earningsByAgent = new Map<string, number>(
      billGroups.map((bill) => [bill.agentId, toNumber(bill._sum.amount) ?? 0])
    );
    const data = agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      category: agent.category ?? undefined,
      isActive: agent.isActive,
      visibility: agent.visibility,
      skillLevel: agent.skillLevel,
      pricePerTask: toNumber(agent.pricePerTask),
      currency: agent.currency ?? undefined,
      rating: agent.rating ?? undefined,
      successRate: agent.successRate ?? undefined,
      activeJobsCount: activeJobsByAgent.get(agent.id) ?? 0,
      completedJobsCount: completedJobsByAgent.get(agent.id) ?? 0,
      totalEarnings: earningsByAgent.get(agent.id) ?? 0,
      createdAt: agent.createdAt.toISOString()
    }));
    return { data, pagination: this.buildPagination(page, limit, total) };
  }

  async getSignedAgents(address: string, page = 1, limit = 10) {
    if (!this.useDatabase) {
      const jobs = await this.jobsService.all();
      const agents = await this.agentsService.list({});
      const ownedAgentIds = new Set(agents.filter((agent) => agent.owner === address).map((agent) => agent.id));
      const filtered = jobs.filter((job) => job.selectedAgentId && ownedAgentIds.has(job.selectedAgentId));
      const start = (page - 1) * limit;
      const paged = filtered.slice(start, start + limit);
      const escrows = await this.walletService.listEscrows();
      const data = await Promise.all(
        paged.map(async (job) => {
          const agent = job.selectedAgentId ? await this.agentsService.findById(job.selectedAgentId) : undefined;
          const escrow = escrows.find((item) => item.jobId === job.id);
          return {
            jobId: job.id,
            jobTitle: job.title,
            jobStatus: job.status,
            agentId: job.selectedAgentId,
            agentName: agent?.name,
            agentCategory: agent?.category,
            agentRating: agent?.rating,
            contractAmount: escrow?.amount,
            currency: escrow?.currency ?? job.currency,
            contractStatus: escrow?.status,
            signedAt: escrow?.createdAt ?? job.createdAt
          };
        })
      );
      return { data, pagination: this.buildPagination(page, limit, filtered.length) };
    }

    const ownedAgents = await this.prisma.agent.findMany({
      where: { owner: address },
      select: { id: true }
    });
    const ownedAgentIds = ownedAgents.map((agent) => agent.id);
    if (ownedAgentIds.length === 0) {
      return { data: [], pagination: this.buildPagination(page, limit, 0) };
    }

    const [jobs, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where: { selectedAgentId: { in: ownedAgentIds } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.job.count({ where: { selectedAgentId: { in: ownedAgentIds } } })
    ]);
    if (jobs.length === 0) {
      return { data: [], pagination: this.buildPagination(page, limit, total) };
    }
    const agentIds = jobs.map((job) => job.selectedAgentId).filter(Boolean) as string[];
    const agents = agentIds.length
      ? await this.prisma.agent.findMany({ where: { id: { in: agentIds } } })
      : [];
    const escrows = await this.prisma.escrow.findMany({ where: { jobId: { in: jobs.map((job) => job.id) } } });
    const agentById = new Map(agents.map((agent) => [agent.id, agent]));
    const escrowByJobId = new Map(escrows.map((escrow) => [escrow.jobId, escrow]));
    const data = jobs.map((job) => {
      const agent = job.selectedAgentId ? agentById.get(job.selectedAgentId) : undefined;
      const escrow = escrowByJobId.get(job.id);
      return {
        jobId: job.id,
        jobTitle: job.title,
        jobStatus: job.status,
        agentId: job.selectedAgentId ?? undefined,
        agentName: agent?.name,
        agentCategory: agent?.category ?? undefined,
        agentRating: agent?.rating ?? undefined,
        contractAmount: toNumber(escrow?.amount),
        currency: escrow?.currency ?? job.currency ?? undefined,
        contractStatus: escrow?.status,
        signedAt: escrow?.createdAt ? escrow.createdAt.toISOString() : job.createdAt.toISOString()
      };
    });
    return { data, pagination: this.buildPagination(page, limit, total) };
  }

  async getDisputes(address: string, page = 1, limit = 10) {
    if (!this.useDatabase) {
      return { data: [], pagination: this.buildPagination(page, limit, 0) };
    }

    const jobIds = await this.prisma.job.findMany({ where: { createdBy: address }, select: { id: true } });
    const orFilters: Array<{ initiator?: string; jobId?: { in: string[] } }> = [{ initiator: address }];
    if (jobIds.length > 0) {
      orFilters.push({ jobId: { in: jobIds.map((job) => job.id) } });
    }

    const [disputes, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where: { OR: orFilters },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.dispute.count({ where: { OR: orFilters } })
    ]);

    if (disputes.length === 0) {
      return { data: [], pagination: this.buildPagination(page, limit, total) };
    }

    const jobMap = new Map(
      (
        await this.prisma.job.findMany({
          where: { id: { in: disputes.map((dispute) => dispute.jobId) } },
          select: { id: true, title: true }
        })
      ).map((job) => [job.id, job.title])
    );
    const escrows = await this.prisma.escrow.findMany({
      where: { id: { in: disputes.map((dispute) => dispute.escrowId) } }
    });
    const escrowMap = new Map(escrows.map((escrow) => [escrow.id, escrow]));
    const data = disputes.map((dispute) => {
      const escrow = escrowMap.get(dispute.escrowId);
      return {
        id: dispute.id,
        jobId: dispute.jobId,
        jobTitle: jobMap.get(dispute.jobId),
        status: dispute.status,
        initiator: dispute.initiator,
        isMyInitiated: dispute.initiator === address,
        reason: dispute.reason ?? undefined,
        votesFor: dispute.votesFor,
        votesAgainst: dispute.votesAgainst,
        totalWeight: toNumber(dispute.totalWeight) ?? 0,
        escrowAmount: toNumber(escrow?.amount),
        currency: escrow?.currency ?? undefined,
        resolvedOutcome: dispute.resolvedOutcome ?? undefined,
        createdAt: dispute.createdAt.toISOString(),
        resolvedAt: dispute.resolvedAt ? dispute.resolvedAt.toISOString() : undefined
      };
    });

    return { data, pagination: this.buildPagination(page, limit, total) };
  }
}
