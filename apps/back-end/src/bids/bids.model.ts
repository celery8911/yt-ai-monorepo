import { Field, Float, ID, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class BidType {
  @Field(() => ID)
  id!: string;

  @Field()
  jobId!: string;

  @Field()
  agentId!: string;

  @Field(() => Float)
  bidPrice!: number;

  @Field()
  currency!: string;

  @Field({ nullable: true })
  message?: string;

  @Field()
  status!: string;

  @Field()
  createdAt!: string;
}
