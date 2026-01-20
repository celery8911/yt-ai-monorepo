import { Injectable } from "@nestjs/common";
import type { Agent as PrismaAgent } from "@prisma/client";
import { Agent, SkillLevel } from "../common/types";
import { generateId, toNumber } from "../common/utils";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAgentDto, UpdateAgentDto } from "./agents.dto";

@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) { }

  private mapAgent(agent: PrismaAgent): Agent {
    return {
      id: agent.id,
      name: agent.name,
      description: agent.description ?? undefined,
      category: agent.category ?? undefined,
      tags: (agent.tags as string[]) ?? [],
      endpointUrl: agent.endpointUrl,
      supportedPaymentMethods: (agent.supportedPaymentMethods as never[]) ?? [],
      skillLevel: agent.skillLevel as SkillLevel,
      deliverableFormats: (agent.deliverableFormats as never[]) ?? [],
      pricePerTask: toNumber(agent.pricePerTask),
      resultBasedMinPrice: toNumber(agent.resultBasedMinPrice),
      minBid: toNumber(agent.minBid),
      currency: agent.currency ?? undefined,
      avgResponseTimeMs: agent.avgResponseTimeMs ?? undefined,
      successRate: agent.successRate ?? undefined,
      rating: agent.rating ?? undefined,
      owner: agent.owner,
      visibility: agent.visibility as "public" | "private",
      isActive: agent.isActive
    };
  }

  async list(filters: {
    category?: string;
    tag?: string;
    paymentMethod?: string;
    skillLevel?: SkillLevel;
    isActive?: boolean;
    visibility?: "public" | "private";
    search?: string;
  }): Promise<Agent[]> {
    const where: Record<string, unknown> = {};
    if (filters.category) where.category = filters.category;
    if (filters.tag) where.tags = { array_contains: [filters.tag] };
    if (filters.paymentMethod) {
      where.supportedPaymentMethods = { array_contains: [filters.paymentMethod] };
    }
    if (filters.skillLevel) where.skillLevel = filters.skillLevel;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.visibility) where.visibility = filters.visibility;

    // 添加搜索条件：模糊匹配 name 或 description
    // 注意：tags 字段为 Json 类型，Prisma 不支持对 JSON 数组内容进行模糊匹配
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const items = await this.prisma.agent.findMany({ where });
    return items.map((item) => this.mapAgent(item));
  }

  async findById(id: string): Promise<Agent | undefined> {
    const agent = await this.prisma.agent.findUnique({ where: { id } });
    if (!agent) return undefined;
    return this.mapAgent(agent);
  }

  async findByIds(ids: string[]): Promise<Agent[]> {
    if (!ids.length) return [];
    const items = await this.prisma.agent.findMany({ where: { id: { in: ids } } });
    return items.map((item) => this.mapAgent(item));
  }

  async create(payload: CreateAgentDto): Promise<Agent> {
    const data = {
      id: generateId("agent"),
      name: payload.name,
      description: payload.description,
      category: payload.category,
      tags: payload.tags,
      endpointUrl: payload.endpointUrl,
      supportedPaymentMethods: payload.supportedPaymentMethods,
      skillLevel: payload.skillLevel,
      deliverableFormats: payload.deliverableFormats,
      pricePerTask: payload.pricePerTask,
      resultBasedMinPrice: payload.resultBasedMinPrice,
      minBid: payload.minBid,
      currency: payload.currency,
      avgResponseTimeMs: payload.avgResponseTimeMs,
      successRate: payload.successRate,
      rating: payload.rating,
      owner: payload.owner,
      visibility: payload.visibility,
      isActive: payload.isActive
    };
    const agent = await this.prisma.agent.create({ data });
    return this.mapAgent(agent);
  }

  async update(id: string, payload: UpdateAgentDto): Promise<Agent | undefined> {
    try {
      const agent = await this.prisma.agent.update({ where: { id }, data: { ...payload } });
      return this.mapAgent(agent);
    } catch {
      return undefined;
    }
  }

  async all(): Promise<Agent[]> {
    const items = await this.prisma.agent.findMany();
    return items.map((item) => this.mapAgent(item));
  }

  async getCategories(): Promise<Array<{ id: string; label: string }>> {
    // 使用 distinct 在数据库层面去重，减少数据传输
    const results = await this.prisma.agent.findMany({
      select: { category: true },
      where: { category: { not: null } },
      distinct: ['category']
    });

    // 构建返回数组
    const categories = [{ id: "ALL", label: "全部" }];
    results.forEach((result) => {
      if (result.category) {
        categories.push({ id: result.category, label: result.category });
      }
    });

    return categories;
  }
}
