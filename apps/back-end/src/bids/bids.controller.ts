import {
	Body,
	Controller,
	Get,
	NotFoundException,
	Param,
	Post,
	Put,
} from "@nestjs/common";
import { BidsService } from "./bids.service";
import { CreateBidDto } from "./bids.dto";

@Controller("bids")
export class BidsController {
	constructor(private readonly bidsService: BidsService) {}

	@Post(":jobId")
	async create(@Param("jobId") jobId: string, @Body() payload: CreateBidDto) {
		return this.bidsService.create(jobId, payload);
	}

	@Get(":jobId")
	async list(@Param("jobId") jobId: string) {
		return this.bidsService.list(jobId);
	}

	@Put(":id/accept")
	async accept(@Param("id") id: string) {
		const bid = await this.bidsService.accept(id);
		if (!bid) {
			throw new NotFoundException("Bid not found");
		}
		return bid;
	}
}
