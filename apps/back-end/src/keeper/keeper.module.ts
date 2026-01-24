import { Module } from "@nestjs/common";
import { KeeperController } from "./keeper.controller";
import { KeeperService } from "./keeper.service";

@Module({
	controllers: [KeeperController],
	providers: [KeeperService],
})
export class KeeperModule {}
