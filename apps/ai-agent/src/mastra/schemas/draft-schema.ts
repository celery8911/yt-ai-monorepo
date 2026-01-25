import { z } from "zod";

export const paymentMethodEnum = z.enum([
	"FREE",
	"PER_TASK",
	"HUMAN_HIRING",
	"RESULT_BASED",
]);

export const skillLevelEnum = z.enum([
	"BEGINNER",
	"INTERMEDIATE",
	"ADVANCED",
	"EXPERT",
]);

export const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const payoutStrategyEnum = z.enum([
	"WINNER_TAKE_ALL",
	"SPLIT_IF_NO_SELECTION",
]);

export const deliverableTypeEnum = z.enum([
	"CODE",
	"DOCUMENTATION",
	"DEPLOYMENT",
	"REPORT",
	"DATASET",
	"MODEL",
]);

export const jobFieldsSchema = z.object({
	title: z.string().optional(),
	description: z.string().optional(),
	category: z.string().optional(),
	tags: z.array(z.string()).optional(),
	paymentMethod: paymentMethodEnum.optional(),
	budgetMin: z.number().min(0).optional(),
	budgetMax: z.number().min(0).optional(),
	currency: z.string().optional(),
	requiredSkillLevel: skillLevelEnum.optional(),
	deliverables: z.string().optional(),
	acceptanceCriteria: z.string().optional(),
	deadlineAt: z.string().optional(),
	priority: priorityEnum.optional(),
	autoMatchEnabled: z.boolean().optional(),
	biddingEnabled: z.boolean().optional(),
	escrowEnabled: z.boolean().optional(),
	visibility: z.enum(["public", "private"]).optional(),
	reviewWindowDays: z.number().min(1).optional(),
	payoutStrategy: payoutStrategyEnum.optional(),
	status: z.enum(["DRAFT", "OPEN"]).optional(),
	createdBy: z.string().optional(),
});

export const agentFieldsSchema = z.object({
	name: z.string().optional(),
	description: z.string().optional(),
	category: z.string().optional(),
	tags: z.array(z.string()).optional(),
	endpointUrl: z.string().optional(),
	supportedPaymentMethods: z.array(paymentMethodEnum).optional(),
	skillLevel: skillLevelEnum.optional(),
	deliverableFormats: z.array(deliverableTypeEnum).optional(),
	pricePerTask: z.number().min(0).optional(),
	resultBasedMinPrice: z.number().min(0).optional(),
	minBid: z.number().min(0).optional(),
	currency: z.string().optional(),
	avgResponseTimeMs: z.number().min(0).optional(),
	successRate: z.number().min(0).max(1).optional(),
	rating: z.number().min(0).max(5).optional(),
	owner: z.string().optional(),
	visibility: z.enum(["public", "private"]).optional(),
	isActive: z.boolean().optional(),
});

const baseDraftSchema = z.object({
	missing: z.array(z.string()).default([]),
	confidence: z.record(z.any()).default({}),
	notes: z.array(z.string()).default([]),
});

export const jobDraftSchema = baseDraftSchema.extend({
	draftType: z.literal("job"),
	fields: jobFieldsSchema,
});

export const agentDraftSchema = baseDraftSchema.extend({
	draftType: z.literal("agent"),
	fields: agentFieldsSchema,
});

export const draftSchema = z.discriminatedUnion("draftType", [
	jobDraftSchema,
	agentDraftSchema,
]);

export type JobDraft = z.infer<typeof jobDraftSchema>;
export type AgentDraft = z.infer<typeof agentDraftSchema>;
export type Draft = z.infer<typeof draftSchema>;
