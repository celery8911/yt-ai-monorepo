import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { NotFoundException } from "@nestjs/common";
import { AgentsService } from "../agents/agents.service";
import { DaoService } from "../dao/dao.service";
import { MatchingService } from "../matching/matching.service";
import { JobsMatchingQueueService } from "./jobs.matching.queue";
import { CreateJobDto, DisputeJobDto, SelectAgentDto } from "./jobs.dto";
import { JobDisputeResultType, JobListType, JobMatchResultType, JobSelectionResultType, JobType } from "./jobs.model";
import { JobsService } from "./jobs.service";

@Resolver(() => JobType)
export class JobsResolver {
  constructor(
    private readonly jobsService: JobsService,
    private readonly agentsService: AgentsService,
    private readonly matchingService: MatchingService,
    private readonly daoService: DaoService,
    private readonly matchingQueue: JobsMatchingQueueService
  ) {}

  @Query(() => JobListType)
  async jobs(
    @Args("status", { nullable: true }) status?: string,
    @Args("category", { nullable: true }) category?: string,
    @Args("tag", { nullable: true }) tag?: string,
    @Args("paymentMethod", { nullable: true }) paymentMethod?: string,
    @Args("priority", { nullable: true }) priority?: string,
    @Args("page", { type: () => Int, nullable: true }) page?: number,
    @Args("limit", { type: () => Int, nullable: true }) limit?: number
  ) {
    return this.jobsService.list({
      status: status as never,
      category,
      tag,
      paymentMethod,
      priority,
      page,
      limit
    });
  }

  @Query(() => JobType)
  async job(@Args("id") id: string) {
    const job = await this.jobsService.findById(id);
    if (!job) {
      throw new NotFoundException("Job not found");
    }
    return job;
  }

  @Query(() => JobMatchResultType)
  async jobMatches(@Args("jobId") jobId: string) {
    const job = await this.jobsService.findById(jobId);
    if (!job) {
      throw new NotFoundException("Job not found");
    }

    const stored = await this.jobsService.getStoredMatches(jobId);
    if (stored.length) {
      const agents = await this.agentsService.findByIds(stored.map((match) => match.agentId));
      const agentMap = new Map(agents.map((agent) => [agent.id, agent]));
      const matches = stored
        .map((match) => {
          const agent = agentMap.get(match.agentId);
          if (!agent) return undefined;
          return { ...agent, score: match.matchScore ?? 0 };
        })
        .filter((match): match is (typeof agents)[number] & { score: number } => Boolean(match));
      return { job, matches };
    }

    if (!this.jobsService.isDatabaseEnabled()) {
      const agents = await this.agentsService.all();
      const matches = this.matchingService.match(job, agents);
      return { job, matches };
    }

    return { job, matches: [] };
  }

  @Mutation(() => JobMatchResultType)
  async createJob(@Args("input") input: CreateJobDto) {
    const job = await this.jobsService.create(input);
    if (input.autoMatchEnabled) {
      await this.matchingQueue.enqueue(job.id);
    }
    return { job, matches: [] };
  }

  @Mutation(() => JobSelectionResultType)
  async selectJobAgent(@Args("jobId") jobId: string, @Args("input") input: SelectAgentDto) {
    const job = await this.jobsService.findById(jobId);
    if (!job) {
      throw new NotFoundException("Job not found");
    }
    const agents = await this.agentsService.all();
    const matches = this.matchingService.match(job, agents);
    const selectedId = input.agentId ?? matches[0]?.id;
    if (selectedId) {
      await this.jobsService.selectAgent(jobId, selectedId);
    }
    const updated = await this.jobsService.findById(jobId);
    if (!updated) {
      throw new NotFoundException("Job not found");
    }
    return { job: updated, selectedAgentId: selectedId, matches };
  }

  @Mutation(() => JobDisputeResultType)
  async disputeJob(@Args("jobId") jobId: string, @Args("input") input: DisputeJobDto) {
    const job = await this.jobsService.findById(jobId);
    if (!job) {
      throw new NotFoundException("Job not found");
    }
    const dispute = await this.daoService.initiate({
      jobId,
      initiator: input.initiator,
      reason: input.reason
    });
    await this.jobsService.updateStatus(jobId, "DISPUTED");
    const updated = await this.jobsService.findById(jobId);
    if (!updated) {
      throw new NotFoundException("Job not found");
    }
    return { job: updated, disputeId: dispute.id };
  }
}
