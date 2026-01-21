import { Field, Float, ID, Int, ObjectType } from "@nestjs/graphql";
import { MatchedAgentType } from "../matching/matching.model";

@ObjectType()
export class JobType {
	@Field(() => ID)
	id!: string;

	@Field()
	title!: string;

	@Field({ nullable: true })
	description?: string;

	@Field({ nullable: true })
	category?: string;

	@Field(() => [String])
	tags!: string[];

	@Field()
	paymentMethod!: string;

	@Field(() => Float, { nullable: true })
	budgetMin?: number;

	@Field(() => Float, { nullable: true })
	budgetMax?: number;

	@Field({ nullable: true })
	currency?: string;

	@Field()
	requiredSkillLevel!: string;

	@Field({ nullable: true })
	deliverables?: string;

	@Field({ nullable: true })
	acceptanceCriteria?: string;

	@Field({ nullable: true })
	deadlineAt?: string;

	@Field()
	priority!: string;

	@Field()
	autoMatchEnabled!: boolean;

	@Field()
	biddingEnabled!: boolean;

	@Field()
	escrowEnabled!: boolean;

	@Field()
	visibility!: string;

	@Field(() => Int)
	reviewWindowDays!: number;

	@Field()
	payoutStrategy!: string;

	@Field()
	status!: string;

	@Field()
	createdBy!: string;

	@Field({ nullable: true })
	selectedAgentId?: string;

	@Field({ nullable: true })
	matchError?: string;

	@Field()
	createdAt!: string;
}

@ObjectType()
export class JobListType {
	@Field(() => [JobType])
	data!: JobType[];

	@Field(() => Int)
	page!: number;

	@Field(() => Int)
	limit!: number;

	@Field(() => Int)
	total!: number;
}

@ObjectType()
export class JobMatchResultType {
	@Field(() => JobType)
	job!: JobType;

	@Field(() => [MatchedAgentType])
	matches!: MatchedAgentType[];
}

@ObjectType()
export class JobSelectionResultType {
	@Field(() => JobType)
	job!: JobType;

	@Field({ nullable: true })
	selectedAgentId?: string;

	@Field(() => [MatchedAgentType])
	matches!: MatchedAgentType[];
}

@ObjectType()
export class JobDisputeResultType {
	@Field(() => JobType)
	job!: JobType;

	@Field()
	disputeId!: string;
}
