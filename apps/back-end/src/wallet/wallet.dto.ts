import { Field, InputType } from "@nestjs/graphql";
import { IsNumber, IsOptional, IsString, Min } from "class-validator";

@InputType()
export class DepositDto {
  @Field()
  @IsString()
  address!: string;

  @Field()
  @IsNumber()
  @Min(0)
  amount!: number;
}

@InputType()
export class CreateEscrowDto {
  @Field()
  @IsString()
  jobId!: string;

  @Field()
  @IsString()
  payer!: string;

  @Field()
  @IsNumber()
  @Min(0)
  amount!: number;

  @Field()
  @IsString()
  currency!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  releaseTo?: string;
}

@InputType()
export class ReleaseEscrowDto {
  @Field()
  @IsString()
  escrowId!: string;
}
