import { Injectable } from "@nestjs/common";
import { Agent, Job, SkillLevel } from "../common/types";

const skillOrder: SkillLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];

const skillLevelMeets = (agentLevel: SkillLevel, requiredLevel: SkillLevel): boolean => {
  return skillOrder.indexOf(agentLevel) >= skillOrder.indexOf(requiredLevel);
};

const tagSimilarity = (jobTags: string[], agentTags: string[]): number => {
  if (!jobTags.length || !agentTags.length) return 0;
  const jobSet = new Set(jobTags);
  const agentSet = new Set(agentTags);
  const intersection = [...jobSet].filter((tag) => agentSet.has(tag)).length;
  const union = new Set([...jobSet, ...agentSet]).size;
  return union ? intersection / union : 0;
};

const responseTimeScore = (avgResponseTimeMs?: number): number => {
  if (!avgResponseTimeMs) return 0.5;
  const normalized = Math.min(avgResponseTimeMs / 5000, 1);
  return 1 - normalized;
};

const ratingScore = (rating?: number): number => {
  if (rating === undefined) return 0.5;
  return Math.max(0, Math.min(rating / 5, 1));
};

const priceFit = (job: Job, agent: Agent): number => {
  const budgetMin = job.budgetMin ?? 0;
  const budgetMax = job.budgetMax ?? 0;
  if (!budgetMin && !budgetMax) return 0.5;

  const agentPrice =
    job.paymentMethod === "RESULT_BASED"
      ? agent.resultBasedMinPrice
      : job.paymentMethod === "HUMAN_HIRING"
        ? agent.minBid
        : agent.pricePerTask;

  if (!agentPrice) return 0.4;
  if (budgetMin && budgetMax) {
    if (agentPrice < budgetMin) return Math.max(0, 1 - (budgetMin - agentPrice) / budgetMin);
    if (agentPrice > budgetMax) return Math.max(0, 1 - (agentPrice - budgetMax) / budgetMax);
    const mid = (budgetMin + budgetMax) / 2;
    const span = budgetMax - budgetMin;
    if (!span) return 1;
    return 1 - Math.abs(agentPrice - mid) / span;
  }
  const budget = budgetMax || budgetMin;
  if (!budget) return 0.5;
  return Math.max(0, 1 - Math.abs(agentPrice - budget) / budget);
};

@Injectable()
export class MatchingService {
  explainNoMatch(job: Job, agents: Agent[]): string {
    if (!agents.length) return "No agents available.";

    const active = agents.filter((agent) => agent.isActive);
    if (!active.length) return "No active agents.";

    const visible = active.filter((agent) => {
      if (agent.visibility === "private" && job.visibility === "public") return false;
      return true;
    });
    if (!visible.length) return "No agents match visibility.";

    const supportsPayment = visible.filter((agent) =>
      agent.supportedPaymentMethods.includes(job.paymentMethod)
    );
    if (!supportsPayment.length) return "No agents support payment method.";

    const skillOk = supportsPayment.filter((agent) =>
      skillLevelMeets(agent.skillLevel, job.requiredSkillLevel)
    );
    if (!skillOk.length) return "No agents meet skill level.";

    const priceOk = skillOk.filter((agent) => priceFit(job, agent) > 0);
    if (!priceOk.length) return "No agents fit budget.";

    return "No matches found.";
  }

  hardFilter(job: Job, agents: Agent[]): Agent[] {
    return agents.filter((agent) => {
      if (!agent.isActive) return false;
      if (agent.visibility === "private" && job.visibility === "public") return false;
      if (!agent.supportedPaymentMethods.includes(job.paymentMethod)) return false;
      if (!skillLevelMeets(agent.skillLevel, job.requiredSkillLevel)) return false;
      const fitsPrice = priceFit(job, agent) > 0;
      return fitsPrice;
    });
  }

  score(job: Job, agents: Agent[]): Array<Agent & { score: number }> {
    const weightsBase = {
      tagSimilarity: 0.35,
      priceFit: 0.2,
      ratingScore: 0.2,
      successRate: 0.15,
      responseTimeScore: 0.1
    };

    const responseWeight =
      job.priority === "URGENT" ? weightsBase.responseTimeScore * 1.2 : weightsBase.responseTimeScore;

    const weights = {
      ...weightsBase,
      responseTimeScore: responseWeight
    };

    const sumWeights =
      weights.tagSimilarity +
      weights.priceFit +
      weights.ratingScore +
      weights.successRate +
      weights.responseTimeScore;

    return agents
      .map((agent) => {
        const score =
          (weights.tagSimilarity * tagSimilarity(job.tags, agent.tags) +
            weights.priceFit * priceFit(job, agent) +
            weights.ratingScore * ratingScore(agent.rating) +
            weights.successRate * (agent.successRate ?? 0.5) +
            weights.responseTimeScore * responseTimeScore(agent.avgResponseTimeMs)) /
          sumWeights;
        return { ...agent, score };
      })
      .sort((a, b) => b.score - a.score);
  }

  match(job: Job, agents: Agent[]): Array<Agent & { score: number }> {
    const filtered = this.hardFilter(job, agents);
    return this.score(job, filtered).slice(0, 3);
  }
}
