import { Injectable } from "@nestjs/common";
import { Agent, Job, SkillLevel } from "../common/types";

const skillOrder: SkillLevel[] = [
	"BEGINNER",
	"INTERMEDIATE",
	"ADVANCED",
	"EXPERT",
];

const skillLevelMeets = (
	agentLevel: SkillLevel,
	requiredLevel: SkillLevel,
): boolean => {
	return skillOrder.indexOf(agentLevel) >= skillOrder.indexOf(requiredLevel);
};

const normalizeTags = (tags: string[]): string[] =>
	tags
		.flatMap((tag) =>
			tag
				.split(/[,\s/|;]+/g)
				.map((item) => item.trim().toLowerCase())
				.filter(Boolean),
		)
		.filter(Boolean);

const tagOverlap = (jobTags: string[], agentTags: string[]): boolean => {
	const jobNormalized = normalizeTags(jobTags);
	const agentNormalized = normalizeTags(agentTags);
	if (!jobNormalized.length || !agentNormalized.length) return false;
	const agentSet = new Set(agentNormalized);
	return jobNormalized.some((tag) => agentSet.has(tag));
};

const tagSimilarity = (jobTags: string[], agentTags: string[]): number => {
	const jobNormalized = normalizeTags(jobTags);
	const agentNormalized = normalizeTags(agentTags);
	if (!jobNormalized.length || !agentNormalized.length) return 0;
	const jobSet = new Set(jobNormalized);
	const agentSet = new Set(agentNormalized);
	const intersection = [...jobSet].filter((tag) => agentSet.has(tag)).length;
	const union = new Set([...jobSet, ...agentSet]).size;
	return union ? intersection / union : 0;
};

const categorySimilarity = (
	jobCategory?: string,
	agentCategory?: string,
): number => {
	if (!jobCategory || !agentCategory) return 0;
	const jobNorm = jobCategory.trim().toLowerCase();
	const agentNorm = agentCategory.trim().toLowerCase();
	if (!jobNorm || !agentNorm) return 0;
	if (jobNorm === agentNorm) return 1;
	if (jobNorm.includes(agentNorm) || agentNorm.includes(jobNorm)) return 0.6;
	return 0;
};

// const responseTimeScore = (avgResponseTimeMs?: number): number => {
// 	if (!avgResponseTimeMs) return 0.5;
// 	const normalized = Math.min(avgResponseTimeMs / 5000, 1);
// 	return 1 - normalized;
// };

// const ratingScore = (rating?: number): number => {
// 	if (rating === undefined) return 0.5;
// 	return Math.max(0, Math.min(rating / 5, 1));
// };

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
		if (agentPrice < budgetMin)
			return Math.max(0, 1 - (budgetMin - agentPrice) / budgetMin);
		if (agentPrice > budgetMax)
			return Math.max(0, 1 - (agentPrice - budgetMax) / budgetMax);
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
		if (!agents.length) return "暂无可用智能体";

		const active = agents.filter((agent) => agent.isActive);
		if (!active.length) return "暂无可用的活跃智能体";

		const visible = active.filter((agent) => {
			if (agent.visibility === "private" && job.visibility === "public")
				return false;
			return true;
		});
		if (!visible.length) return "暂无符合可见性要求的智能体";

		const currencyOk = visible.filter((agent) => {
			if (!job.currency) return true;
			return agent.currency === job.currency;
		});
		if (!currencyOk.length) return "暂无匹配币种的智能体";

		const supportsPayment = currencyOk.filter((agent) =>
			agent.supportedPaymentMethods.includes(job.paymentMethod),
		);
		if (!supportsPayment.length) return "暂无支持该支付方式的智能体";

		const skillOk = supportsPayment.filter((agent) =>
			skillLevelMeets(agent.skillLevel, job.requiredSkillLevel),
		);
		if (!skillOk.length) return "暂无满足技能等级要求的智能体";

		const priceOk = skillOk.filter((agent) => priceFit(job, agent) > 0);
		if (!priceOk.length) return "暂无符合预算范围的智能体";

		return "暂未匹配到合适的智能体";
	}

	hardFilter(job: Job, agents: Agent[]): Agent[] {
		const hasTagOrCategory = job.tags.length > 0 || Boolean(job.category);
		const filtered = agents.filter((agent) => {
			if (!agent.isActive) return false;
			if (agent.visibility === "private" && job.visibility === "public")
				return false;
			if (!hasTagOrCategory) return true;
			const tagHit = tagOverlap(job.tags, agent.tags);
			const categoryScore = categorySimilarity(job.category, agent.category);
			return tagHit || categoryScore > 0;
		});
		return filtered;
	}

	score(job: Job, agents: Agent[]): Array<Agent & { score: number }> {
		const weightsBase = {
			tagSimilarity: 0.7,
			categorySimilarity: 0.3,
		};

		const weights = { ...weightsBase };

		const sumWeights = weights.tagSimilarity + weights.categorySimilarity;

		return agents
			.map((agent) => {
				const score =
					(weights.tagSimilarity * tagSimilarity(job.tags, agent.tags) +
						weights.categorySimilarity *
							categorySimilarity(job.category, agent.category)) /
					sumWeights;
				return { ...agent, score };
			})
			.sort((a, b) => b.score - a.score);
	}

	match(job: Job, agents: Agent[]): Array<Agent & { score: number }> {
		const filtered = this.hardFilter(job, agents);
		return this.score(job, filtered);
	}
}
