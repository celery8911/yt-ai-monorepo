import { Field, Float, ID, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class AgentType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  category?: string;

  @Field(() => [String])
  tags!: string[];

  @Field()
  endpointUrl!: string;

  @Field(() => [String])
  supportedPaymentMethods!: string[];

  @Field()
  skillLevel!: string;

  @Field(() => [String])
  deliverableFormats!: string[];

  @Field(() => Float, { nullable: true })
  pricePerTask?: number;

  @Field(() => Float, { nullable: true })
  resultBasedMinPrice?: number;

  @Field(() => Float, { nullable: true })
  minBid?: number;

  @Field({ nullable: true })
  currency?: string;

  @Field(() => Float, { nullable: true })
  avgResponseTimeMs?: number;

  @Field(() => Float, { nullable: true })
  successRate?: number;

  @Field(() => Float, { nullable: true })
  rating?: number;

  @Field()
  owner!: string;

  @Field()
  visibility!: string;

  @Field()
  isActive!: boolean;
}
