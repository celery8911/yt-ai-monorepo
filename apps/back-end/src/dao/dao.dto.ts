import { Field, InputType } from "@nestjs/graphql";
import { IsIn, IsNumber, IsOptional, IsString, Min } from "class-validator";
import type { VoteValue } from "../common/types";

@InputType()
export class InitiateDisputeDto {
  @Field()
  @IsString()
  jobId!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  escrowId?: string;

  @Field()
  @IsString()
  initiator!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  reason?: string;
}

@InputType()
export class VoteDto {
  @Field()
  @IsString()
  disputeId!: string;

  @Field()
  @IsString()
  voter!: string;

  @Field()
  @IsIn(["approve", "reject"])
  vote!: VoteValue;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;
}
