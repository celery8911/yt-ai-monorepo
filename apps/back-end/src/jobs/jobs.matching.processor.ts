import { OnQueueFailed, Process, Processor } from "@nestjs/bull";
import type { Job as QueueJob } from "bull";
import { AgentsService } from "../agents/agents.service";
import { generateId } from "../common/utils";
import { MatchingService } from "../matching/matching.service";
import { PrismaService } from "../prisma/prisma.service";
import { JobsService } from "./jobs.service";
import { MATCHING_JOB_NAME, MATCHING_QUEUE_NAME } from "./jobs.matching.constants";

@Processor(MATCHING_QUEUE_NAME)
export class JobsMatchingProcessor {
  constructor(
    private readonly jobsService: JobsService,
    private readonly agentsService: AgentsService,
    private readonly matchingService: MatchingService,
    private readonly prisma: PrismaService
  ) {}

  @Process({ name: MATCHING_JOB_NAME, concurrency: 5 })
  async handle(job: QueueJob<{ jobId: string }>) {
    const target = await this.jobsService.findById(job.data.jobId);
    if (!target || !target.autoMatchEnabled) return;

    if (target.status !== "MATCHING") {
      await this.jobsService.setMatchStatus(target.id, "MATCHING", null);
    }

    const agents = await this.agentsService.all();
    const matches = this.matchingService.match(target, agents);

    if (process.env.DATABASE_URL) {
      await this.prisma.match.deleteMany({ where: { jobId: target.id } });
      if (matches.length) {
        await this.prisma.match.createMany({
          data: matches.map((agent) => ({
            id: generateId("match"),
            jobId: target.id,
            agentId: agent.id,
            matchScore: agent.score,
            status: "SUGGESTED"
          }))
        });
      }
    }

    const nextStatus = matches.length ? "IN_PROGRESS" : "OPEN";
    const matchError = matches.length ? null : "No matches found.";
    await this.jobsService.setMatchStatus(target.id, nextStatus, matchError);
  }

  @OnQueueFailed()
  async handleFailure(job: QueueJob<{ jobId: string }>, error: Error) {
    const maxAttempts = job.opts.attempts ?? 1;
    if (job.attemptsMade < maxAttempts) return;
    await this.jobsService.setMatchStatus(job.data.jobId, "FAILED", error.message);
  }
}
