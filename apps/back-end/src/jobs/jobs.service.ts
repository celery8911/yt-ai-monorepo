import { BadRequestException, Injectable } from "@nestjs/common";
import type { Job as PrismaJob } from "@prisma/client";
import { Job, JobStatus } from "../common/types";
import { generateId, nowIso, toNumber } from "../common/utils";
import { PrismaService } from "../prisma/prisma.service";
import { CreateJobDto } from "./jobs.dto";

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
      createdAt: job.createdAt.toISOString()
    };
  }

  private validateBudget(payload: CreateJobDto) {
    if (payload.budgetMin !== undefined && payload.budgetMax !== undefined) {
      if (payload.budgetMin > payload.budgetMax) {
        throw new BadRequestException("budgetMin must be <= budgetMax");
      }
    }
  }

  async create(payload: CreateJobDto): Promise<Job> {
    this.validateBudget(payload);
    const job: Job = {
      id: generateId("job"),
      status: "OPEN",
      reviewWindowDays: payload.reviewWindowDays ?? 7,
      createdAt: nowIso(),
      ...payload
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
          selectedAgentId: job.selectedAgentId
        }
      });
      return this.mapJob(created);
    }
    this.jobs.push(job);
    return job;
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
        this.prisma.job.findMany({ where, skip: (page - 1) * limit, take: limit }),
        this.prisma.job.count({ where })
      ]);
      return { data: items.map((item) => this.mapJob(item)), page, limit, total };
    }
    const filtered = this.jobs.filter((job) => {
      if (filters.status && job.status !== filters.status) return false;
      if (filters.category && job.category !== filters.category) return false;
      if (filters.tag && !job.tags.includes(filters.tag)) return false;
      if (filters.paymentMethod && job.paymentMethod !== filters.paymentMethod) return false;
      if (filters.priority && job.priority !== filters.priority) return false;
      return true;
    });
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);
    return {
      data,
      page,
      limit,
      total: filtered.length
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
          data: { selectedAgentId: agentId, status: "IN_PROGRESS" }
        });
        return this.mapJob(updated);
      }
      job.selectedAgentId = agentId;
      job.status = "IN_PROGRESS";
    }
    return job;
  }

  async updateStatus(jobId: string, status: JobStatus): Promise<Job | undefined> {
    const job = await this.findById(jobId);
    if (!job) return undefined;
    if (this.useDatabase) {
      const updated = await this.prisma.job.update({ where: { id: jobId }, data: { status } });
      return this.mapJob(updated);
    }
    job.status = status;
    return job;
  }

  async all(): Promise<Job[]> {
    if (this.useDatabase) {
      const items = await this.prisma.job.findMany();
      return items.map((item) => this.mapJob(item));
    }
    return this.jobs;
  }
}
