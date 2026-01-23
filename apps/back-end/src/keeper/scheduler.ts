import { runOnce } from "./runner";
import { loadKeeperConfig } from "./config";
import { logInfo, logWarn } from "./logger";

let running = false;

async function tick() {
	if (running) {
		logWarn("Previous tick still running, skipping.");
		return;
	}
	running = true;
	try {
		await runOnce();
	} finally {
		running = false;
	}
}

export function startScheduler() {
	const config = loadKeeperConfig();
	logInfo(`Starting keeper scheduler, interval=${config.intervalMs}ms`);
	tick();
	setInterval(tick, config.intervalMs);
}
