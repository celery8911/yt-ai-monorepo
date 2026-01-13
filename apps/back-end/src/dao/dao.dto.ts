import { Field, InputType } from "@nestjs/graphql";
import { IsIn, IsNumber, IsOptional, IsString, Min } from "class-validator";

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
  vote!: "approve" | "reject";

  @Field()
  @IsNumber()
  @Min(0)
  weight!: number;
}
