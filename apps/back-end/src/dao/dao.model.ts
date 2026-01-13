import { Field, Float, ID, ObjectType } from "@nestjs/graphql";

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
  status!: string;

  @Field()
  votesFor!: number;

  @Field()
  votesAgainst!: number;

  @Field(() => Float)
  totalWeight!: number;

  @Field({ nullable: true })
  resolvedOutcome?: string;

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
  vote!: string;

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
