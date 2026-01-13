import { Injectable } from "@nestjs/common";
import type { Agent as PrismaAgent } from "@prisma/client";
import { Agent, SkillLevel } from "../common/types";
import { generateId, toNumber } from "../common/utils";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAgentDto, UpdateAgentDto } from "./agents.dto";

@Injectable()
export class AgentsService {
  private readonly useDatabase = Boolean(process.env.DATABASE_URL);
  private readonly agents: Agent[] = [
    {
      id: "agent_alpha",
      name: "Alpha Researcher",
      description: "Market research and competitive analysis.",
      category: "Research",
      tags: ["market", "analysis", "strategy"],
      endpointUrl: "https://agents.local/alpha",
      supportedPaymentMethods: ["PER_TASK", "RESULT_BASED"],
      skillLevel: "ADVANCED",
      deliverableFormats: ["REPORT", "DOCUMENTATION"],
      pricePerTask: 1200,
      resultBasedMinPrice: 800,
      minBid: 400,
      currency: "USD",
      avgResponseTimeMs: 1200,
      successRate: 0.91,
      rating: 4.7,
      owner: "team-alpha",
      visibility: "public",
      isActive: true
    },
    {
      id: "agent_beta",
      name: "Beta Builder",
      description: "Full-stack prototype delivery.",
      category: "Engineering",
      tags: ["full-stack", "prototype", "api"],
      endpointUrl: "https://agents.local/beta",
      supportedPaymentMethods: ["PER_TASK", "HUMAN_HIRING"],
      skillLevel: "EXPERT",
      deliverableFormats: ["CODE", "DEPLOYMENT"],
      pricePerTask: 2400,
      resultBasedMinPrice: 1500,
      minBid: 1000,
      currency: "USD",
      avgResponseTimeMs: 900,
      successRate: 0.95,
      rating: 4.9,
      owner: "beta-labs",
      visibility: "public",
      isActive: true
    },
    {
      id: "agent_gamma",
      name: "Gamma Writer",
      description: "Technical documentation and product specs.",
      category: "Documentation",
      tags: ["docs", "specs", "product"],
      endpointUrl: "https://agents.local/gamma",
      supportedPaymentMethods: ["FREE", "PER_TASK"],
      skillLevel: "INTERMEDIATE",
      deliverableFormats: ["DOCUMENTATION", "REPORT"],
      pricePerTask: 600,
      resultBasedMinPrice: 300,
      minBid: 200,
      currency: "USD",
      avgResponseTimeMs: 1600,
      successRate: 0.88,
      rating: 4.3,
      owner: "gamma-studio",
      visibility: "public",
      isActive: true
    },
    {
      id: "agent_delta",
      name: "Delta Analyst",
      description: "Data pipelines and KPI dashboards.",
      category: "Data",
      tags: ["data", "etl", "dashboard"],
      endpointUrl: "https://agents.local/delta",
      supportedPaymentMethods: ["PER_TASK", "RESULT_BASED"],
      skillLevel: "ADVANCED",
      deliverableFormats: ["DATASET", "REPORT", "CODE"],
      pricePerTask: 1500,
      resultBasedMinPrice: 1000,
      minBid: 600,
      currency: "USD",
      avgResponseTimeMs: 1100,
      successRate: 0.92,
      rating: 4.6,
      owner: "delta-ops",
      visibility: "public",
      isActive: true
    },
    {
      id: "agent_sigma",
      name: "Sigma Operator",
      description: "MLOps deployment and monitoring.",
      category: "ML Ops",
      tags: ["mlops", "monitoring", "deployment"],
      endpointUrl: "https://agents.local/sigma",
      supportedPaymentMethods: ["HUMAN_HIRING", "RESULT_BASED"],
      skillLevel: "EXPERT",
      deliverableFormats: ["DEPLOYMENT", "REPORT"],
      pricePerTask: 3000,
      resultBasedMinPrice: 2000,
      minBid: 1200,
      currency: "USD",
      avgResponseTimeMs: 800,
      successRate: 0.96,
      rating: 4.8,
      owner: "sigma-co",
      visibility: "private",
      isActive: true
    }
  ];

  constructor(private readonly prisma: PrismaService) {}

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
  }): Promise<Agent[]> {
    if (this.useDatabase) {
      const where: Record<string, unknown> = {};
      if (filters.category) where.category = filters.category;
      if (filters.tag) where.tags = { array_contains: [filters.tag] };
      if (filters.paymentMethod) {
        where.supportedPaymentMethods = { array_contains: [filters.paymentMethod] };
      }
      if (filters.skillLevel) where.skillLevel = filters.skillLevel;
      if (filters.isActive !== undefined) where.isActive = filters.isActive;
      if (filters.visibility) where.visibility = filters.visibility;
      const items = await this.prisma.agent.findMany({ where });
      return items.map((item) => this.mapAgent(item));
    }

    return this.agents.filter((agent) => {
      if (filters.category && agent.category !== filters.category) return false;
      if (filters.tag && !agent.tags.includes(filters.tag)) return false;
      if (
        filters.paymentMethod &&
        !agent.supportedPaymentMethods.includes(filters.paymentMethod as never)
      ) {
        return false;
      }
      if (filters.skillLevel && agent.skillLevel !== filters.skillLevel) return false;
      if (filters.isActive !== undefined && agent.isActive !== filters.isActive) return false;
      if (filters.visibility && agent.visibility !== filters.visibility) return false;
      return true;
    });
  }

  async findById(id: string): Promise<Agent | undefined> {
    if (this.useDatabase) {
      const agent = await this.prisma.agent.findUnique({ where: { id } });
      if (!agent) return undefined;
      return this.mapAgent(agent);
    }
    return this.agents.find((agent) => agent.id === id);
  }

  async create(payload: CreateAgentDto): Promise<Agent> {
    if (this.useDatabase) {
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
    const agent: Agent = {
      id: generateId("agent"),
      ...payload
    };
    this.agents.push(agent);
    return agent;
  }

  async update(id: string, payload: UpdateAgentDto): Promise<Agent | undefined> {
    if (this.useDatabase) {
      try {
        const agent = await this.prisma.agent.update({ where: { id }, data: { ...payload } });
        return this.mapAgent(agent);
      } catch {
        return undefined;
      }
    }
    const agent = await this.findById(id);
    if (!agent) return undefined;
    Object.assign(agent, payload);
    return agent;
  }

  async all(): Promise<Agent[]> {
    if (this.useDatabase) {
      const items = await this.prisma.agent.findMany();
      return items.map((item) => this.mapAgent(item));
    }
    return this.agents;
  }
}
