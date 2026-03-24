import { Args, Query, Resolver } from "@nestjs/graphql";
import { NotFoundException } from "@nestjs/common";
import { BillType } from "./bills.model";
import { BillsService } from "./bills.service";

@Resolver(() => BillType)
export class BillsResolver {
	constructor(private readonly billsService: BillsService) {}

	@Query(() => [BillType])
	async bills(
		@Args("role", { nullable: true }) role?: "payee" | "payer",
		@Args("address", { nullable: true }) address?: string,
	) {
		return this.billsService.list(role, address);
	}

	@Query(() => BillType)
	async bill(@Args("id") id: string) {
		const bill = await this.billsService.getById(id);
		if (!bill) {
			throw new NotFoundException("Bill not found");
		}
		return bill;
	}
}
