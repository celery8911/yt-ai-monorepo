import { JsonRpcProvider, Wallet, Contract, formatEther } from "ethers";
import { loadKeeperConfig } from "./config";
import { logError, logInfo, logWarn } from "./logger";
import { escrowReadyQuery, disputeReadyQuery } from "./queries";
import { querySubgraph } from "./subgraph.client";
import { KeeperState } from "./state";

type EscrowReadyResult = {
	escrows: Array<{
		id: string;
		jobId: string;
		releaseAt: string;
		status: string;
	}>;
};
type DisputeReadyResult = {
	disputes: Array<{
		id: string;
		jobId: string;
		createdAt: string;
		status: string;
	}>;
};

const escrowAbi = ["function releaseReady()"];
const daoAbi = ["function resolveReady()"];

let escrowState: KeeperState | null = null;
let disputeState: KeeperState | null = null;

function getStates() {
	if (!escrowState || !disputeState) {
		const config = loadKeeperConfig();
		escrowState = new KeeperState(
			config.cooldownMs,
			config.backoffBaseMs,
			config.maxRetries,
		);
		disputeState = new KeeperState(
			config.cooldownMs,
			config.backoffBaseMs,
			config.maxRetries,
		);
	}
	return { escrowState, disputeState };
}

function filterReadyJobIds(
	state: KeeperState,
	jobIds: string[],
	nowMs: number,
) {
	const allowed = jobIds.filter((jobId) => state.shouldAttempt(jobId, nowMs));
	const skipped = state.getSkipped(jobIds, nowMs);
	return { allowed, skipped };
}

async function simulateCall(contract: Contract, fnName: string) {
	try {
		await contract.getFunction(fnName).staticCall();
		return true;
	} catch (error) {
		logWarn(`Simulate ${fnName} failed: ${String(error)}`);
		return false;
	}
}

function logReceiptCost(
	label: string,
	gasUsed?: bigint | null,
	gasPrice?: bigint | null,
) {
	if (!gasUsed || !gasPrice) return;
	const cost = gasUsed * gasPrice;
	logInfo(
		`${label} gasUsed=${gasUsed.toString()} cost=${formatEther(cost)} ETH`,
	);
}

export async function runOnce() {
	const config = loadKeeperConfig();

	if (!config.subgraphUrl || !config.rpcUrl) {
		logError("Missing SUBGRAPH_URL or RPC_URL");
		return;
	}
	if (!config.keeperPrivateKey) {
		logError("Missing KEEPER_PRIVATE_KEY");
		return;
	}
	if (!config.escrowAddress || !config.daoAddress) {
		logError("Missing ESCROW_ADDRESS or DAO_ADDRESS");
		return;
	}

	const provider = new JsonRpcProvider(config.rpcUrl);
	const wallet = new Wallet(config.keeperPrivateKey, provider);
	const escrow = new Contract(config.escrowAddress, escrowAbi, wallet);
	const dao = new Contract(config.daoAddress, daoAbi, wallet);

	const now = Math.floor(Date.now() / 1000);
	const disputeCutoff = now - config.votingPeriodSeconds;

	const escrows = await querySubgraph<
		Record<string, unknown>,
		EscrowReadyResult
	>(config.subgraphUrl, {
		query: escrowReadyQuery,
		variables: { now, limit: config.maxBatch },
	});

	const disputes = await querySubgraph<
		Record<string, unknown>,
		DisputeReadyResult
	>(config.subgraphUrl, {
		query: disputeReadyQuery,
		variables: { now: disputeCutoff, limit: config.maxBatch },
	});

	const escrowCount = escrows.escrows.length;
	const disputeCount = disputes.disputes.length;

	const escrowIds = escrows.escrows.map((item) => item.jobId);
	const disputeIds = disputes.disputes.map((item) => item.jobId);
	const nowMs = Date.now();
	const { escrowState, disputeState } = getStates();
	const escrowFilter = filterReadyJobIds(escrowState, escrowIds, nowMs);
	const disputeFilter = filterReadyJobIds(disputeState, disputeIds, nowMs);

	logInfo(`Ready escrows: ${escrowCount}, ready disputes: ${disputeCount}`);
	logInfo(`Escrow jobIds: ${escrowIds.length ? escrowIds.join(", ") : "none"}`);
	logInfo(
		`Dispute jobIds: ${disputeIds.length ? disputeIds.join(", ") : "none"}`,
	);
	if (escrowFilter.skipped.length) {
		logWarn(`Escrow backoff skipped: ${escrowFilter.skipped.join(", ")}`);
	}
	if (disputeFilter.skipped.length) {
		logWarn(`Dispute backoff skipped: ${disputeFilter.skipped.join(", ")}`);
	}

	if (config.dryRun) {
		logWarn("Dry-run mode enabled. No transactions sent.");
		return;
	}

	if (escrowFilter.allowed.length > 0) {
		try {
			if (config.simulateOnly) {
				logWarn("Simulate-only mode enabled. No transactions sent.");
				const ok = await simulateCall(escrow, "releaseReady");
				if (ok) {
					logInfo("Escrow releaseReady simulation ok.");
				}
			} else {
				const ok = await simulateCall(escrow, "releaseReady");
				if (!ok) {
					escrowState.markFailure(escrowFilter.allowed, nowMs);
					return;
				}
				const tx = await escrow.releaseReady();
				logInfo(`Escrow releaseReady tx: ${tx.hash}`);
				const receipt = await tx.wait();
				logReceiptCost(
					"Escrow releaseReady",
					receipt?.gasUsed,
					receipt?.effectiveGasPrice ?? receipt?.gasPrice,
				);
				escrowState.markSuccess(escrowFilter.allowed, nowMs);
			}
		} catch (error) {
			logError(`Escrow releaseReady failed: ${String(error)}`);
			if (!config.simulateOnly) {
				escrowState.markFailure(escrowFilter.allowed, nowMs);
			}
		}
	}

	if (disputeFilter.allowed.length > 0) {
		try {
			if (config.simulateOnly) {
				logWarn("Simulate-only mode enabled. No transactions sent.");
				const ok = await simulateCall(dao, "resolveReady");
				if (ok) {
					logInfo("Dispute resolveReady simulation ok.");
				}
			} else {
				const ok = await simulateCall(dao, "resolveReady");
				if (!ok) {
					disputeState.markFailure(disputeFilter.allowed, nowMs);
					return;
				}
				const tx = await dao.resolveReady();
				logInfo(`Dispute resolveReady tx: ${tx.hash}`);
				const receipt = await tx.wait();
				logReceiptCost(
					"Dispute resolveReady",
					receipt?.gasUsed,
					receipt?.effectiveGasPrice ?? receipt?.gasPrice,
				);
				disputeState.markSuccess(disputeFilter.allowed, nowMs);
			}
		} catch (error) {
			logError(`Dispute resolveReady failed: ${String(error)}`);
			if (!config.simulateOnly) {
				disputeState.markFailure(disputeFilter.allowed, nowMs);
			}
		}
	}
}
