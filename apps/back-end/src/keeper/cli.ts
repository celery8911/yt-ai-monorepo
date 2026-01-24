import { runOnce, startScheduler } from "./index";
import { logInfo } from "./logger";

const once = process.argv.includes("--once");
const dryRun = process.env.KEEPER_DRY_RUN === "true";

logInfo(`Keeper CLI start (once=${once}, dryRun=${dryRun})`);

if (once) {
	runOnce().catch((error) => {
		console.error(error);
		process.exitCode = 1;
	});
} else {
	startScheduler();
}
