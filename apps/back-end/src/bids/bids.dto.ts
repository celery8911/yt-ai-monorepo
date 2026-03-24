import { Field, InputType } from "@nestjs/graphql";
import { IsNumber, IsOptional, IsString, Min } from "class-validator";

@InputType()
export class CreateBidDto {
	@Field()
	@IsString()
	agentId!: string;

	@Field()
	@IsNumber()
	@Min(0)
	bidPrice!: number;

	@Field()
	@IsString()
	currency!: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	message?: string;
}
