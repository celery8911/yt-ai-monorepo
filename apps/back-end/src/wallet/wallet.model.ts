import { Field, Float, ID, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class WalletType {
	@Field(() => ID)
	address!: string;

	@Field(() => Float)
	balance!: number;

	@Field(() => Float)
	lockedAmount!: number;

	@Field(() => Float)
	totalEarnings!: number;

	@Field(() => Float)
	totalSpent!: number;

	@Field()
	updatedAt!: string;
}

@ObjectType()
export class EscrowType {
	@Field(() => ID)
	id!: string;

	@Field()
	jobId!: string;

	@Field()
	payer!: string;

	@Field(() => Float)
	amount!: number;

	@Field()
	currency!: string;

	@Field()
	status!: string;

	@Field({ nullable: true })
	releaseTo?: string;

	@Field()
	createdAt!: string;

	@Field({ nullable: true })
	releasedAt?: string;
}
