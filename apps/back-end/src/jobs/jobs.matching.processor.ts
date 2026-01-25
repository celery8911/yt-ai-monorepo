import { OnQueueFailed, Process, Processor } from "@nestjs/bull";
import type { Job as QueueJob } from "bull";
import { AgentsService } from "../agents/agents.service";
import { MatchingService } from "../matching/matching.service";
import { JobsService } from "./jobs.service";
import { buildMatchSelection } from "./jobs.matching.utils";
import {
	MATCHING_JOB_NAME,
	MATCHING_QUEUE_NAME,
} from "./jobs.matching.constants";

@Processor(MATCHING_QUEUE_NAME)
export class JobsMatchingProcessor {
	constructor(
		private readonly jobsService: JobsService,
		private readonly agentsService: AgentsService,
		private readonly matchingService: MatchingService,
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
		const { candidates, selected } = buildMatchSelection(matches, target.id);
		const selectedIds = new Set(selected.map((agent) => agent.id));
		const noMatchReason =
			matches.length === 0
				? this.matchingService.explainNoMatch(target, agents)
				: null;

		await this.jobsService.saveMatches(
			target.id,
			candidates.map((agent) => ({
				id: agent.id,
				score: agent.score,
				status: selectedIds.has(agent.id) ? "SELECTED" : "CANDIDATE",
			})),
		);

		const nextStatus = matches.length ? "IN_PROGRESS" : "FAILED";
		const matchError = matches.length ? null : noMatchReason;
		await this.jobsService.setMatchStatus(target.id, nextStatus, matchError);
	}

	@OnQueueFailed()
	async handleFailure(job: QueueJob<{ jobId: string }>, error: Error) {
		const maxAttempts = job.opts.attempts ?? 1;
		if (job.attemptsMade < maxAttempts) return;
		await this.jobsService.setMatchStatus(
			job.data.jobId,
			"FAILED",
			error.message,
		);
	}
}
