import {
	IsString,
	IsNotEmpty,
	IsOptional,
	IsNumber,
	IsEnum,
} from "class-validator";
import { EngagementType } from "../common/types";

export class CreateEngagementDto {
	@IsString()
	@IsNotEmpty()
	escrowId!: string; // The bytes32 string from contract

	@IsString()
	@IsNotEmpty()
	userId!: string;

	@IsString()
	@IsNotEmpty()
	agentId!: string;

	@IsString()
	@IsOptional()
	jobId?: string;

	@IsString()
	@IsNotEmpty()
	agentOwner!: string;

	@IsNumber()
	price!: number;

	@IsEnum(["DIRECT", "JOB_BASED"])
	type!: EngagementType;
}

export class UpdateEngagementStatusDto {
	@IsEnum(["ACTIVE", "COMPLETED", "DISPUTED", "CANCELLED"])
	status!: string;
}
