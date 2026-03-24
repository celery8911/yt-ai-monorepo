import { Field, Float, ID, ObjectType } from "@nestjs/graphql";
import type { DisputeOutcome, DisputeStatus, VoteValue } from "../common/types";

@ObjectType()
export class DisputeType {
	@Field(() => ID)
	id!: string;

	@Field()
	jobId!: string;

	@Field()
	escrowId!: string;

	@Field()
	initiator!: string;

	@Field({ nullable: true })
	reason?: string;

	@Field()
	status!: DisputeStatus;

	@Field()
	votesFor!: number;

	@Field()
	votesAgainst!: number;

	@Field(() => Float)
	totalWeight!: number;

	@Field({ nullable: true })
	resolvedOutcome?: DisputeOutcome;

	@Field()
	createdAt!: string;

	@Field({ nullable: true })
	resolvedAt?: string;
}

@ObjectType()
export class VoteType {
	@Field(() => ID)
	id!: string;

	@Field()
	disputeId!: string;

	@Field()
	voter!: string;

	@Field()
	vote!: VoteValue;

	@Field(() => Float)
	weight!: number;

	@Field()
	createdAt!: string;
}

@ObjectType()
export class DisputeDetailType {
	@Field(() => DisputeType)
	dispute!: DisputeType;

	@Field(() => [VoteType])
	votes!: VoteType[];
}
