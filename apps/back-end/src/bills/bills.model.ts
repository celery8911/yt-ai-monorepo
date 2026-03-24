import { Field, Float, ID, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class BillType {
	@Field(() => ID)
	id!: string;

	@Field()
	jobId!: string;

	@Field()
	agentId!: string;

	@Field(() => Float)
	amount!: number;

	@Field()
	currency!: string;

	@Field()
	status!: string;

	@Field({ nullable: true })
	escrowId?: string;

	@Field()
	payeeAddress!: string;

	@Field()
	payerAddress!: string;

	@Field()
	createdAt!: string;

	@Field({ nullable: true })
	paidAt?: string;
}
