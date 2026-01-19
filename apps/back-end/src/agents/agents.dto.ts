import { Field, InputType } from "@nestjs/graphql";
import { IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsString, IsUrl, Max, Min } from "class-validator";
import { DeliverableType, PaymentMethod, SkillLevel } from "../common/types";

@InputType()
export class CreateAgentDto {
  @Field()
  @IsString()
  name!: string;

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
  @IsUrl({ require_tld: false })
  endpointUrl!: string;

  @Field(() => [String])
  @IsArray()
  supportedPaymentMethods!: PaymentMethod[];

  @Field()
  @IsIn(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"])
  skillLevel!: SkillLevel;

  @Field(() => [String])
  @IsArray()
  deliverableFormats!: DeliverableType[];

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerTask?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  resultBasedMinPrice?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minBid?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  currency?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  avgResponseTimeMs?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  successRate?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @Field()
  @IsString()
  owner!: string;

  @Field()
  @IsIn(["public", "private"])
  visibility!: "public" | "private";

  @Field()
  @IsBoolean()
  isActive!: boolean;
}

@InputType()
export class UpdateAgentDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  category?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl({ require_tld: false })
  endpointUrl?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  supportedPaymentMethods?: PaymentMethod[];

  @Field({ nullable: true })
  @IsOptional()
  @IsIn(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"])
  skillLevel?: SkillLevel;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  deliverableFormats?: DeliverableType[];

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerTask?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  resultBasedMinPrice?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minBid?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  currency?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  avgResponseTimeMs?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  successRate?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  owner?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsIn(["public", "private"])
  visibility?: "public" | "private";

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
