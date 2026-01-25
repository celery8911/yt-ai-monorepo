import {
	BadRequestException,
	Body,
	Controller,
	Get,
	NotFoundException,
	Param,
	Post,
	Put,
	Query,
} from "@nestjs/common";
import { AgentsService } from "../agents/agents.service";
import type { Job } from "../common/types";
import { DaoService } from "../dao/dao.service";
import { MatchingService } from "../matching/matching.service";
import { JobsMatchingQueueService } from "./jobs.matching.queue";
import { JobsService } from "./jobs.service";
import { buildMatchSelection } from "./jobs.matching.utils";
import {
	CreateJobDto,
	DisputeJobDto,
	SelectAgentDto,
	UpdateJobDto,
} from "./jobs.dto";

type InvokeAgentPayload = {
	input?: string;
	context?: Record<string, unknown>;
};

@Controller("jobs")
export class JobsController {
	constructor(
		private readonly jobsService: JobsService,
		private readonly agentsService: AgentsService,
		private readonly matchingService: MatchingService,
		private readonly daoService: DaoService,
		private readonly matchingQueue: JobsMatchingQueueService,
	) {}

	private async buildMatches(job: Job) {
		const stored = await this.jobsService.getStoredMatches(job.id);
		if (stored.length) {
			const agents = await this.agentsService.findByIds(
				stored.map((match) => match.agentId),
			);
			const agentMap = new Map(agents.map((agent) => [agent.id, agent]));
			return stored
				.map((match) => {
					const agent = agentMap.get(match.agentId);
					if (!agent) return undefined;
					return {
						...agent,
						score: match.matchScore ?? 0,
						matchStatus: match.status ?? undefined,
					};
				})
				.filter(Boolean) as Array<
				(typeof agents)[number] & { score: number; matchStatus?: string }
			>;
		}

		if (!this.jobsService.isDatabaseEnabled()) {
			const agents = await this.agentsService.all();
			const matches = this.matchingService.match(job, agents);
			const { candidates, selected } = buildMatchSelection(matches, job.id);
			const selectedIds = new Set(selected.map((agent) => agent.id));
			return candidates.map((agent) => ({
				...agent,
				matchStatus: selectedIds.has(agent.id) ? "SELECTED" : "CANDIDATE",
			}));
		}

		return [];
	}

	private async buildSelectedAgent(selectedAgentId?: string) {
		if (!selectedAgentId) return undefined;
		return this.agentsService.findById(selectedAgentId);
	}

	private async runAutoMatch(job: Job) {
		const hasRedisHost = Boolean(process.env.REDIS_HOST);
		if (hasRedisHost) {
			await this.matchingQueue.enqueue(job.id);
			await this.jobsService.setMatchStatus(job.id, "MATCHING", null);
			return { job: await this.jobsService.findById(job.id), matches: [] };
		}

		const agents = await this.agentsService.all();
		const matches = this.matchingService.match(job, agents);
		const { candidates, selected } = buildMatchSelection(matches, job.id);
		const selectedIds = new Set(selected.map((agent) => agent.id));
		const noMatchReason =
			matches.length === 0
				? this.matchingService.explainNoMatch(job, agents)
				: null;
		await this.jobsService.saveMatches(
			job.id,
			candidates.map((agent) => ({
				id: agent.id,
				score: agent.score,
				status: selectedIds.has(agent.id) ? "SELECTED" : "CANDIDATE",
			})),
		);
		const updated =
			(await this.jobsService.setMatchStatus(
				job.id,
				matches.length ? "IN_PROGRESS" : "FAILED",
				matches.length ? null : noMatchReason,
			)) ?? job;
		return {
			job: updated,
			matches: candidates.map((agent) => ({
				...agent,
				matchStatus: selectedIds.has(agent.id) ? "SELECTED" : "CANDIDATE",
			})),
		};
	}

	@Post()
	async create(@Body() payload: CreateJobDto) {
		const job = await this.jobsService.create(payload);
		if (!payload.autoMatchEnabled) {
			return { job, matches: [] };
		}
		return this.runAutoMatch(job);
	}

	@Get()
	async list(
		@Query("status") status?: string,
		@Query("category") category?: string,
		@Query("tag") tag?: string,
		@Query("paymentMethod") paymentMethod?: string,
		@Query("priority") priority?: string,
		@Query("page") page?: string,
		@Query("limit") limit?: string,
	) {
		const parsedPage = page ? Number(page) : undefined;
		const parsedLimit = limit ? Number(limit) : undefined;
		if (page && Number.isNaN(parsedPage)) {
			throw new BadRequestException("page must be a number");
		}
		if (limit && Number.isNaN(parsedLimit)) {
			throw new BadRequestException("limit must be a number");
		}
		if (parsedPage !== undefined && parsedPage < 1) {
			throw new BadRequestException("page must be >= 1");
		}
		if (parsedLimit !== undefined && parsedLimit < 1) {
			throw new BadRequestException("limit must be >= 1");
		}
		return this.jobsService.list({
			status: status as never,
			category,
			tag,
			paymentMethod,
			priority,
			page: parsedPage,
			limit: parsedLimit,
		});
	}

	@Get(":id")
	async detail(@Param("id") id: string) {
		const job = await this.jobsService.findById(id);
		if (!job) {
			throw new NotFoundException("Job not found");
		}
		const matches =
			job.status === "IN_PROGRESS" ? await this.buildMatches(job) : [];
		const selectedAgent =
			job.status === "SUBMITTED" ||
			job.status === "REVIEWING" ||
			job.status === "COMPLETED"
				? await this.buildSelectedAgent(job.selectedAgentId)
				: undefined;
		return { job, matches, selectedAgent };
	}

	@Get(":id/matches")
	async matches(@Param("id") id: string) {
		const job = await this.jobsService.findById(id);
		if (!job) {
			throw new NotFoundException("Job not found");
		}

		const stored = await this.jobsService.getStoredMatches(id);
		if (stored.length) {
			const agents = await this.agentsService.findByIds(
				stored.map((match) => match.agentId),
			);
			const agentMap = new Map(agents.map((agent) => [agent.id, agent]));
			const matches = stored
				.map((match) => {
					const agent = agentMap.get(match.agentId);
					if (!agent) return undefined;
					return {
						...agent,
						score: match.matchScore ?? 0,
						matchStatus: match.status ?? undefined,
					};
				})
				.filter(Boolean) as Array<
				(typeof agents)[number] & { score: number; matchStatus?: string }
			>;
			return { job, matches };
		}

		if (!this.jobsService.isDatabaseEnabled()) {
			const agents = await this.agentsService.all();
			const matches = this.matchingService.match(job, agents);
			const { candidates, selected } = buildMatchSelection(matches, job.id);
			const selectedIds = new Set(selected.map((agent) => agent.id));
			return {
				job,
				matches: candidates.map((agent) => ({
					...agent,
					matchStatus: selectedIds.has(agent.id) ? "SELECTED" : "CANDIDATE",
				})),
			};
		}

		return { job, matches: [] };
	}

	@Put(":id")
	async update(@Param("id") id: string, @Body() payload: UpdateJobDto) {
		const before = await this.jobsService.findById(id);
		const updated = await this.jobsService.update(id, payload);
		if (!updated) {
			throw new NotFoundException("Job not found");
		}
		const publishTriggered =
			before?.status === "DRAFT" &&
			payload.status === "OPEN" &&
			updated.autoMatchEnabled;
		if (publishTriggered) {
			return this.runAutoMatch(updated);
		}
		return updated;
	}

	@Put(":id/select")
	async select(@Param("id") id: string, @Body() payload: SelectAgentDto) {
		const job = await this.jobsService.findById(id);
		if (!job) {
			throw new NotFoundException("Job not found");
		}
		const agents = await this.agentsService.all();
		const matches = this.matchingService.match(job, agents);
		const selectedId = payload.agentId ?? matches[0]?.id;
		if (selectedId) {
			await this.jobsService.selectAgent(id, selectedId);
		}
		return {
			job: await this.jobsService.findById(id),
			selectedAgentId: selectedId,
			matches,
		};
	}

	@Post(":id/dispute")
	async dispute(@Param("id") id: string, @Body() payload: DisputeJobDto) {
		const job = await this.jobsService.findById(id);
		if (!job) {
			throw new NotFoundException("Job not found");
		}
		const dispute = await this.daoService.initiate({
			jobId: id,
			initiator: payload.initiator,
			reason: payload.reason,
		});
		await this.jobsService.updateStatus(id, "DISPUTED");
		return { job: await this.jobsService.findById(id), dispute };
	}

	@Post(":id/agents/:agentId/invoke")
	async invokeAgent(
		@Param("id") id: string,
		@Param("agentId") agentId: string,
		@Body() payload: InvokeAgentPayload,
	) {
		const job = await this.jobsService.findById(id);
		if (!job) {
			throw new NotFoundException("Job not found");
		}
		const agent = await this.agentsService.findById(agentId);
		if (!agent) {
			throw new NotFoundException("Agent not found");
		}
		if (!agent.endpointUrl) {
			throw new BadRequestException("Agent endpointUrl is missing");
		}

		const startedAt = Date.now();
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 15000);
		let status: "ok" | "error" = "ok";
		let result: unknown;
		let error: string | undefined;

		try {
			const response = await fetch(agent.endpointUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					input: payload?.input,
					context: payload?.context,
					job: {
						id: job.id,
						title: job.title,
						description: job.description,
						category: job.category,
						tags: job.tags,
						paymentMethod: job.paymentMethod,
						budgetMin: job.budgetMin,
						budgetMax: job.budgetMax,
						currency: job.currency,
						priority: job.priority,
						deliverables: job.deliverables,
						acceptanceCriteria: job.acceptanceCriteria,
						deadlineAt: job.deadlineAt,
					},
				}),
				signal: controller.signal,
			});
			const text = await response.text();
			if (!response.ok) {
				status = "error";
				error = `Agent response ${response.status}`;
				result = text;
			} else {
				try {
					result = text ? JSON.parse(text) : null;
				} catch {
					result = text;
				}
			}
		} catch (err) {
			status = "error";
			error = err instanceof Error ? err.message : "Agent request failed";
		} finally {
			clearTimeout(timeout);
		}

		return {
			agentId,
			status,
			result,
			error,
			durationMs: Date.now() - startedAt,
		};
	}

	@Post(":id/match/run")
	async runMatch(@Param("id") id: string) {
		const job = await this.jobsService.findById(id);
		if (!job) {
			throw new NotFoundException("Job not found");
		}

		const agents = await this.agentsService.all();
		const matches = this.matchingService.match(job, agents);
		const { candidates, selected } = buildMatchSelection(matches, job.id);
		const selectedIds = new Set(selected.map((agent) => agent.id));
		const noMatchReason =
			matches.length === 0
				? this.matchingService.explainNoMatch(job, agents)
				: null;

		await this.jobsService.saveMatches(
			job.id,
			candidates.map((agent) => ({
				id: agent.id,
				score: agent.score,
				status: selectedIds.has(agent.id) ? "SELECTED" : "CANDIDATE",
			})),
		);

		const updated =
			(await this.jobsService.setMatchStatus(
				job.id,
				matches.length ? "IN_PROGRESS" : "FAILED",
				matches.length ? null : noMatchReason,
			)) ?? job;

		return {
			job: updated,
			matches: candidates.map((agent) => ({
				...agent,
				matchStatus: selectedIds.has(agent.id) ? "SELECTED" : "CANDIDATE",
			})),
		};
	}
}
