import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { NotFoundException } from "@nestjs/common";
import { EscrowType, WalletType } from "./wallet.model";
import { WalletService } from "./wallet.service";
import { CreateEscrowDto, DepositDto, ReleaseEscrowDto } from "./wallet.dto";

@Resolver()
export class WalletResolver {
	constructor(private readonly walletService: WalletService) {}

	@Mutation(() => WalletType)
	async deposit(@Args("input") input: DepositDto) {
		return this.walletService.deposit(input);
	}

	@Mutation(() => EscrowType)
	async createEscrow(@Args("input") input: CreateEscrowDto) {
		return this.walletService.createEscrow(input);
	}

	@Mutation(() => EscrowType)
	async releaseEscrow(@Args("input") input: ReleaseEscrowDto) {
		const escrow = await this.walletService.release(input.escrowId);
		if (!escrow) {
			throw new NotFoundException("Escrow not found");
		}
		return escrow;
	}

	@Query(() => WalletType)
	async walletBalance(@Args("address") address: string) {
		return this.walletService.balance(address);
	}
}
