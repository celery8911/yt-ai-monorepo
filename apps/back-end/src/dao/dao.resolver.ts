import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { NotFoundException } from "@nestjs/common";
import { DisputeDetailType, DisputeType } from "./dao.model";
import { DaoService } from "./dao.service";
import { InitiateDisputeDto, VoteDto } from "./dao.dto";

@Resolver(() => DisputeType)
export class DaoResolver {
	constructor(private readonly daoService: DaoService) {}

	@Mutation(() => DisputeType)
	async initiateDispute(@Args("input") input: InitiateDisputeDto) {
		return this.daoService.initiate(input);
	}

	@Mutation(() => DisputeType)
	async voteDispute(@Args("input") input: VoteDto) {
		const dispute = await this.daoService.vote(input);
		if (!dispute) {
			throw new NotFoundException("Dispute not found");
		}
		return dispute;
	}

	@Query(() => DisputeDetailType)
	async dispute(@Args("id") id: string) {
		const detail = await this.daoService.getDetail(id);
		if (!detail.dispute) {
			throw new NotFoundException("Dispute not found");
		}
		return { dispute: detail.dispute, votes: detail.votes };
	}
}
