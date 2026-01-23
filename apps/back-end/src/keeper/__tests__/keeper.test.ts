import test from "node:test";
import assert from "node:assert/strict";
import { loadKeeperConfig } from "../config";

test("loadKeeperConfig uses defaults", () => {
	const config = loadKeeperConfig();
	assert.ok(config.intervalMs > 0);
	assert.ok(config.maxBatch > 0);
	assert.ok(config.votingPeriodSeconds > 0);
});
