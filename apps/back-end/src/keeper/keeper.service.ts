import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { startScheduler } from "./scheduler";
import { logInfo } from "./logger";

@Injectable()
export class KeeperService implements OnModuleInit, OnModuleDestroy {
	private enabled = false;

	onModuleInit() {
		this.enabled =
			(process.env.KEEPER_ENABLED || "true").toLowerCase() === "true";
		if (!this.enabled) {
			logInfo("Keeper disabled by KEEPER_ENABLED=false");
			return;
		}
		logInfo("Keeper starting...");
		startScheduler();
	}

	onModuleDestroy() {
		if (this.enabled) {
			logInfo("Keeper stopping...");
		}
	}
}
