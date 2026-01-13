import { Field, InputType } from "@nestjs/graphql";
import { IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { PaymentMethod, PayoutStrategy, PriorityLevel, SkillLevel } from "../common/types";

@InputType()
export class CreateJobDto {
  @Field()
  @IsString()
  title!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  category?: string;

  @Field(() => [String])
  @IsArray()
  tags!: string[];

  @Field()
  @IsIn(["FREE", "PER_TASK", "HUMAN_HIRING", "RESULT_BASED"])
  paymentMethod!: PaymentMethod;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMin?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMax?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  currency?: string;

  @Field()
  @IsIn(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"])
  requiredSkillLevel!: SkillLevel;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  deliverables?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  acceptanceCriteria?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  deadlineAt?: string;

  @Field()
  @IsIn(["LOW", "MEDIUM", "HIGH", "URGENT"])
  priority!: PriorityLevel;

  @Field()
  @IsBoolean()
  autoMatchEnabled!: boolean;

  @Field()
  @IsBoolean()
  biddingEnabled!: boolean;

  @Field()
  @IsBoolean()
  escrowEnabled!: boolean;

  @Field()
  @IsIn(["public", "private"])
  visibility!: "public" | "private";

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  reviewWindowDays?: number;

  @Field()
  @IsIn(["WINNER_TAKE_ALL", "SPLIT_IF_NO_SELECTION"])
  payoutStrategy!: PayoutStrategy;

  @Field()
  @IsString()
  createdBy!: string;
}

@InputType()
export class SelectAgentDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  agentId?: string;
}

@InputType()
export class DisputeJobDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  reason?: string;

  @Field()
  @IsString()
  initiator!: string;
}
