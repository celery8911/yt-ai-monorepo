import { Module } from "@nestjs/common";
import { ChainStatusController } from "./chain-status.controller";
import { ChainStatusService } from "./chain-status.service";

@Module({
	controllers: [ChainStatusController],
	providers: [ChainStatusService],
})
export class ChainStatusModule {}
