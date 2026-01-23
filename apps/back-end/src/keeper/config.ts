export type KeeperConfig = {
	subgraphUrl: string;
	rpcUrl: string;
	keeperPrivateKey: string;
	escrowAddress: string;
	daoAddress: string;
	intervalMs: number;
	maxBatch: number;
	dryRun: boolean;
	votingPeriodSeconds: number;
	cooldownMs: number;
	backoffBaseMs: number;
	maxRetries: number;
	simulateOnly: boolean;
};

const DEFAULT_INTERVAL_MS = 2 * 60 * 1000;
const DEFAULT_MAX_BATCH = 10;
const DEFAULT_VOTING_PERIOD_SECONDS = 48 * 60 * 60;
const DEFAULT_COOLDOWN_MS = 60 * 1000;
const DEFAULT_BACKOFF_BASE_MS = 30 * 1000;
const DEFAULT_MAX_RETRIES = 5;

export function loadKeeperConfig(): KeeperConfig {
	const subgraphUrl = process.env.SUBGRAPH_URL || "";
	const rpcUrl = process.env.RPC_URL || "";
	const keeperPrivateKey = process.env.KEEPER_PRIVATE_KEY || "";
	const escrowAddress = process.env.ESCROW_ADDRESS || "";
	const daoAddress = process.env.DAO_ADDRESS || "";
	const intervalMs = Number(
		process.env.KEEPER_INTERVAL_MS || DEFAULT_INTERVAL_MS,
	);
	const maxBatch = Number(process.env.KEEPER_MAX_BATCH || DEFAULT_MAX_BATCH);
	const dryRun = (process.env.KEEPER_DRY_RUN || "").toLowerCase() === "true";
	const votingPeriodSeconds = Number(
		process.env.KEEPER_VOTING_PERIOD_SECONDS || DEFAULT_VOTING_PERIOD_SECONDS,
	);
	const cooldownMs = Number(
		process.env.KEEPER_COOLDOWN_MS || DEFAULT_COOLDOWN_MS,
	);
	const backoffBaseMs = Number(
		process.env.KEEPER_BACKOFF_BASE_MS || DEFAULT_BACKOFF_BASE_MS,
	);
	const maxRetries = Number(
		process.env.KEEPER_MAX_RETRIES || DEFAULT_MAX_RETRIES,
	);
	const simulateOnly =
		(process.env.KEEPER_SIMULATE || "").toLowerCase() === "true";

	return {
		subgraphUrl,
		rpcUrl,
		keeperPrivateKey,
		escrowAddress,
		daoAddress,
		intervalMs,
		maxBatch,
		dryRun,
		votingPeriodSeconds,
		cooldownMs,
		backoffBaseMs,
		maxRetries,
		simulateOnly,
	};
}
