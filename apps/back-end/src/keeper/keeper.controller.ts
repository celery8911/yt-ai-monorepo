import { Controller, Get } from "@nestjs/common";
import { loadKeeperConfig } from "./config";

@Controller("keeper")
export class KeeperController {
	@Get("health")
	health() {
		const config = loadKeeperConfig();
		return {
			enabled: (process.env.KEEPER_ENABLED || "true").toLowerCase() === "true",
			intervalMs: config.intervalMs,
			maxBatch: config.maxBatch,
			dryRun: config.dryRun,
		};
	}
}
