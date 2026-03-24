import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { NotFoundException } from "@nestjs/common";
import { BidType } from "./bids.model";
import { BidsService } from "./bids.service";
import { CreateBidDto } from "./bids.dto";

@Resolver(() => BidType)
export class BidsResolver {
	constructor(private readonly bidsService: BidsService) {}

	@Query(() => [BidType])
	async bids(@Args("jobId") jobId: string) {
		return this.bidsService.list(jobId);
	}

	@Mutation(() => BidType)
	async createBid(
		@Args("jobId") jobId: string,
		@Args("input") input: CreateBidDto,
	) {
		return this.bidsService.create(jobId, input);
	}

	@Mutation(() => BidType)
	async acceptBid(@Args("id") id: string) {
		const bid = await this.bidsService.accept(id);
		if (!bid) {
			throw new NotFoundException("Bid not found");
		}
		return bid;
	}
}
