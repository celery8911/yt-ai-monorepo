import { Field, Float, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class DashboardOverviewType {
	@Field(() => Int)
	totalAgents!: number;

	@Field(() => Int)
	totalJobs!: number;

	@Field(() => Float)
	totalEscrow!: number;

	@Field(() => Int)
	activeJobs!: number;

	@Field(() => Int)
	completedJobs!: number;

	@Field(() => Int)
	disputedJobs!: number;

	@Field(() => Float)
	myTotalEarnings!: number;

	@Field(() => Float)
	mySuccessRate!: number;

	@Field(() => Int)
	myActiveJobs!: number;

	@Field(() => Float)
	myTotalSpent!: number;

	@Field(() => Int)
	myPublishedJobs!: number;

	@Field(() => Int)
	myCompletedJobs!: number;
}

@ObjectType()
export class AgentPerformanceType {
	@Field()
	agentId!: string;

	@Field(() => Float)
	earnings!: number;
}

@ObjectType()
export class JobTrendType {
	@Field()
	date!: string;

	@Field(() => Int)
	value!: number;
}
