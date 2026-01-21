import { BadRequestException, Injectable } from "@nestjs/common";
import type { Job as PrismaJob } from "@prisma/client";
import { Job, JobStatus } from "../common/types";
import { generateId, nowIso, toNumber } from "../common/utils";
import { PrismaService } from "../prisma/prisma.service";
import { CreateJobDto, UpdateJobDto } from "./jobs.dto";

@Injectable()
export class JobsService {
	private readonly useDatabase = Boolean(process.env.DATABASE_URL);
	private readonly jobs: Job[] = [];

	constructor(private readonly prisma: PrismaService) {}

	private mapJob(job: PrismaJob): Job {
		return {
			id: job.id,
			title: job.title,
			description: job.description ?? undefined,
			category: job.category ?? undefined,
			tags: (job.tags as string[]) ?? [],
			paymentMethod: job.paymentMethod as Job["paymentMethod"],
			budgetMin: toNumber(job.budgetMin),
			budgetMax: toNumber(job.budgetMax),
			currency: job.currency ?? undefined,
			requiredSkillLevel: job.requiredSkillLevel as Job["requiredSkillLevel"],
			deliverables: job.deliverables ?? undefined,
			acceptanceCriteria: job.acceptanceCriteria ?? undefined,
			deadlineAt: job.deadlineAt ? job.deadlineAt.toISOString() : undefined,
			priority: job.priority as Job["priority"],
			autoMatchEnabled: job.autoMatchEnabled,
			biddingEnabled: job.biddingEnabled,
			escrowEnabled: job.escrowEnabled,
			visibility: job.visibility as Job["visibility"],
			reviewWindowDays: job.reviewWindowDays,
			payoutStrategy: job.payoutStrategy as Job["payoutStrategy"],
			status: job.status as Job["status"],
			createdBy: job.createdBy,
			selectedAgentId: job.selectedAgentId ?? undefined,
			matchError: job.matchError ?? undefined,
			createdAt: job.createdAt.toISOString(),
		};
	}

	private validateBudgetRange(budgetMin?: number, budgetMax?: number) {
		if (
			budgetMin !== undefined &&
			budgetMax !== undefined &&
			budgetMin > budgetMax
		) {
			throw new BadRequestException("budgetMin must be <= budgetMax");
		}
	}

	async create(payload: CreateJobDto): Promise<Job> {
		this.validateBudgetRange(payload.budgetMin, payload.budgetMax);
		const status = payload.status ?? "OPEN";
		const job: Job = {
			id: generateId("job"),
			status,
			reviewWindowDays: payload.reviewWindowDays ?? 7,
			createdAt: nowIso(),
			matchError: undefined,
			...payload,
		};
		if (this.useDatabase) {
			const created = await this.prisma.job.create({
				data: {
					id: job.id,
					title: job.title,
					description: job.description,
					category: job.category,
					tags: job.tags,
					createdBy: job.createdBy,
					status: job.status,
					paymentMethod: job.paymentMethod,
					budgetMin: job.budgetMin,
					budgetMax: job.budgetMax,
					currency: job.currency,
					deadlineAt: job.deadlineAt ? new Date(job.deadlineAt) : undefined,
					priority: job.priority,
					requiredSkillLevel: job.requiredSkillLevel,
					deliverables: job.deliverables,
					acceptanceCriteria: job.acceptanceCriteria,
					autoMatchEnabled: job.autoMatchEnabled,
					biddingEnabled: job.biddingEnabled,
					escrowEnabled: job.escrowEnabled,
					visibility: job.visibility,
					reviewWindowDays: job.reviewWindowDays,
					payoutStrategy: job.payoutStrategy,
					selectedAgentId: job.selectedAgentId,
					matchError: job.matchError ?? null,
				},
			});
			return this.mapJob(created);
		}
		this.jobs.push(job);
		return job;
	}

	async setMatchStatus(
		jobId: string,
		status: JobStatus,
		matchError?: string | null,
	): Promise<Job | undefined> {
		const job = await this.findById(jobId);
		if (!job) return undefined;
		if (this.useDatabase) {
			const updated = await this.prisma.job.update({
				where: { id: jobId },
				data: { status, matchError: matchError ?? null },
			});
			return this.mapJob(updated);
		}
		job.status = status;
		job.matchError = matchError ?? undefined;
		return job;
	}

	async update(jobId: string, payload: UpdateJobDto): Promise<Job | undefined> {
		const existing = await this.findById(jobId);
		if (!existing) return undefined;
		if (existing.status !== "DRAFT") {
			throw new BadRequestException("Only draft jobs can be edited");
		}
		const merged = {
			...existing,
			...payload,
			reviewWindowDays: payload.reviewWindowDays ?? existing.reviewWindowDays,
		};
		this.validateBudgetRange(merged.budgetMin, merged.budgetMax);
		if (this.useDatabase) {
			const data: Record<string, unknown> = {};
			if (payload.title !== undefined) data.title = payload.title;
			if (payload.description !== undefined)
				data.description = payload.description;
			if (payload.category !== undefined) data.category = payload.category;
			if (payload.tags !== undefined) data.tags = payload.tags;
			if (payload.createdBy !== undefined) data.createdBy = payload.createdBy;
			if (payload.status !== undefined) data.status = payload.status;
			if (payload.paymentMethod !== undefined)
				data.paymentMethod = payload.paymentMethod;
			if (payload.budgetMin !== undefined) data.budgetMin = payload.budgetMin;
			if (payload.budgetMax !== undefined) data.budgetMax = payload.budgetMax;
			if (payload.currency !== undefined) data.currency = payload.currency;
			if (payload.deadlineAt !== undefined) {
				data.deadlineAt = payload.deadlineAt
					? new Date(payload.deadlineAt)
					: undefined;
			}
			if (payload.priority !== undefined) data.priority = payload.priority;
			if (payload.requiredSkillLevel !== undefined) {
				data.requiredSkillLevel = payload.requiredSkillLevel;
			}
			if (payload.deliverables !== undefined)
				data.deliverables = payload.deliverables;
			if (payload.acceptanceCriteria !== undefined) {
				data.acceptanceCriteria = payload.acceptanceCriteria;
			}
			if (payload.autoMatchEnabled !== undefined) {
				data.autoMatchEnabled = payload.autoMatchEnabled;
			}
			if (payload.biddingEnabled !== undefined)
				data.biddingEnabled = payload.biddingEnabled;
			if (payload.escrowEnabled !== undefined)
				data.escrowEnabled = payload.escrowEnabled;
			if (payload.visibility !== undefined)
				data.visibility = payload.visibility;
			if (payload.reviewWindowDays !== undefined) {
				data.reviewWindowDays = payload.reviewWindowDays;
			}
			if (payload.payoutStrategy !== undefined)
				data.payoutStrategy = payload.payoutStrategy;
			const updated = await this.prisma.job.update({
				where: { id: jobId },
				data,
			});
			return this.mapJob(updated);
		}
		if (payload.title !== undefined) existing.title = payload.title;
		if (payload.description !== undefined)
			existing.description = payload.description;
		if (payload.category !== undefined) existing.category = payload.category;
		if (payload.tags !== undefined) existing.tags = payload.tags;
		if (payload.createdBy !== undefined) existing.createdBy = payload.createdBy;
		if (payload.status !== undefined) existing.status = payload.status;
		if (payload.paymentMethod !== undefined)
			existing.paymentMethod = payload.paymentMethod;
		if (payload.budgetMin !== undefined) existing.budgetMin = payload.budgetMin;
		if (payload.budgetMax !== undefined) existing.budgetMax = payload.budgetMax;
		if (payload.currency !== undefined) existing.currency = payload.currency;
		if (payload.deadlineAt !== undefined)
			existing.deadlineAt = payload.deadlineAt;
		if (payload.priority !== undefined) existing.priority = payload.priority;
		if (payload.requiredSkillLevel !== undefined) {
			existing.requiredSkillLevel = payload.requiredSkillLevel;
		}
		if (payload.deliverables !== undefined)
			existing.deliverables = payload.deliverables;
		if (payload.acceptanceCriteria !== undefined) {
			existing.acceptanceCriteria = payload.acceptanceCriteria;
		}
		if (payload.autoMatchEnabled !== undefined) {
			existing.autoMatchEnabled = payload.autoMatchEnabled;
		}
		if (payload.biddingEnabled !== undefined) {
			existing.biddingEnabled = payload.biddingEnabled;
		}
		if (payload.escrowEnabled !== undefined)
			existing.escrowEnabled = payload.escrowEnabled;
		if (payload.visibility !== undefined)
			existing.visibility = payload.visibility;
		if (payload.reviewWindowDays !== undefined) {
			existing.reviewWindowDays = payload.reviewWindowDays;
		}
		if (payload.payoutStrategy !== undefined) {
			existing.payoutStrategy = payload.payoutStrategy;
		}
		return existing;
	}

	async list(filters: {
		status?: JobStatus;
		category?: string;
		tag?: string;
		paymentMethod?: string;
		priority?: string;
		page?: number;
		limit?: number;
	}): Promise<{ data: Job[]; page: number; limit: number; total: number }> {
		const page = filters.page ?? 1;
		const limit = filters.limit ?? 10;
		if (this.useDatabase) {
			const where: Record<string, unknown> = {};
			if (filters.status) where.status = filters.status;
			if (filters.category) where.category = filters.category;
			if (filters.tag) where.tags = { array_contains: [filters.tag] };
			if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;
			if (filters.priority) where.priority = filters.priority;
			const [items, total] = await this.prisma.$transaction([
				this.prisma.job.findMany({
					where,
					skip: (page - 1) * limit,
					take: limit,
				}),
				this.prisma.job.count({ where }),
			]);
			return {
				data: items.map((item) => this.mapJob(item)),
				page,
				limit,
				total,
			};
		}
		const filtered = this.jobs.filter((job) => {
			if (filters.status && job.status !== filters.status) return false;
			if (filters.category && job.category !== filters.category) return false;
			if (filters.tag && !job.tags.includes(filters.tag)) return false;
			if (filters.paymentMethod && job.paymentMethod !== filters.paymentMethod)
				return false;
			if (filters.priority && job.priority !== filters.priority) return false;
			return true;
		});
		const start = (page - 1) * limit;
		const data = filtered.slice(start, start + limit);
		return {
			data,
			page,
			limit,
			total: filtered.length,
		};
	}

	async findById(id: string): Promise<Job | undefined> {
		if (this.useDatabase) {
			const job = await this.prisma.job.findUnique({ where: { id } });
			return job ? this.mapJob(job) : undefined;
		}
		return this.jobs.find((job) => job.id === id);
	}

	async selectAgent(jobId: string, agentId?: string): Promise<Job | undefined> {
		const job = await this.findById(jobId);
		if (!job) return undefined;
		if (agentId) {
			if (this.useDatabase) {
				const updated = await this.prisma.job.update({
					where: { id: jobId },
					data: { selectedAgentId: agentId, status: "IN_PROGRESS" },
				});
				return this.mapJob(updated);
			}
			job.selectedAgentId = agentId;
			job.status = "IN_PROGRESS";
		}
		return job;
	}

	async updateStatus(
		jobId: string,
		status: JobStatus,
	): Promise<Job | undefined> {
		const job = await this.findById(jobId);
		if (!job) return undefined;
		if (this.useDatabase) {
			const updated = await this.prisma.job.update({
				where: { id: jobId },
				data: { status },
			});
			return this.mapJob(updated);
		}
		job.status = status;
		return job;
	}

	async saveMatches(
		jobId: string,
		matches: Array<{ id: string; score: number }>,
	): Promise<void> {
		if (!this.useDatabase) return;
		await this.prisma.match.deleteMany({ where: { jobId } });
		if (!matches.length) return;
		await this.prisma.match.createMany({
			data: matches.map((agent) => ({
				id: generateId("match"),
				jobId,
				agentId: agent.id,
				matchScore: agent.score,
				status: "SUGGESTED",
			})),
		});
	}

	async getStoredMatches(
		jobId: string,
	): Promise<Array<{ agentId: string; matchScore: number | null }>> {
		if (!this.useDatabase) return [];
		const matches = await this.prisma.match.findMany({
			where: { jobId },
			orderBy: { matchScore: "desc" },
		});
		return matches.map((match) => ({
			agentId: match.agentId,
			matchScore: match.matchScore,
		}));
	}

	isDatabaseEnabled(): boolean {
		return this.useDatabase;
	}

	async all(): Promise<Job[]> {
		if (this.useDatabase) {
			const items = await this.prisma.job.findMany();
			return items.map((item) => this.mapJob(item));
		}
		return this.jobs;
	}
}
