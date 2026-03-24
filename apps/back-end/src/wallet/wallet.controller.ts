import {
	BadRequestException,
	Body,
	Controller,
	Get,
	NotFoundException,
	Post,
	Query,
} from "@nestjs/common";
import { WalletService } from "./wallet.service";
import { CreateEscrowDto, DepositDto, ReleaseEscrowDto } from "./wallet.dto";

@Controller("wallet")
export class WalletController {
	constructor(private readonly walletService: WalletService) {}

	@Post("deposit")
	async deposit(@Body() payload: DepositDto) {
		return this.walletService.deposit(payload);
	}

	@Post("escrow")
	async escrow(@Body() payload: CreateEscrowDto) {
		return this.walletService.createEscrow(payload);
	}

	@Post("release")
	async release(@Body() payload: ReleaseEscrowDto) {
		const escrow = await this.walletService.release(payload.escrowId);
		if (!escrow) {
			throw new NotFoundException("Escrow not found");
		}
		return escrow;
	}

	@Get("balance")
	async balance(@Query("address") address: string) {
		if (!address) {
			throw new BadRequestException("address is required");
		}
		return this.walletService.balance(address);
	}
}
