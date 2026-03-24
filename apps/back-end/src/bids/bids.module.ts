import { Module } from "@nestjs/common";
import { BidsController } from "./bids.controller";
import { BidsResolver } from "./bids.resolver";
import { BidsService } from "./bids.service";

@Module({
	controllers: [BidsController],
	providers: [BidsService, BidsResolver],
})
export class BidsModule {}
