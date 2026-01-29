import {
	EngagementCreated,
	PaymentReleased,
	PaymentRefunded,
} from "../../generated/AgentHiring/AgentHiring";
import { Engagement, Transaction } from "../../generated/schema";
import { BigInt as GraphBigInt, Bytes, crypto } from "@graphprotocol/graph-ts";

export function handleEngagementCreated(event: EngagementCreated): void {
	// Create Engagement entity
	const engagementId = event.params.engagementId.toString();
	const engagement = new Engagement(engagementId);

	engagement.engagementId = event.params.engagementId;
	engagement.user = event.params.user;
	engagement.agentId = event.params.agentId;
	engagement.agentOwner = event.params.agentOwner;
	engagement.jobId = event.params.jobId;
	engagement.purchaseType =
		event.params.purchaseType === 0 ? "DIRECT" : "JOB_BASED";
	engagement.totalPaid = event.params.amount;
	engagement.startTime = event.block.timestamp;
	engagement.endTime = GraphBigInt.zero();
	engagement.status = "ACTIVE";

	// Calculate escrow ID (matches solidity: keccak256(abi.encodePacked("engagement", engagementId)))
	const prefix = Bytes.fromUTF8("engagement");
	const idHex = event.params.engagementId.toHexString().slice(2);
	const padded = `0x${"0".repeat(64 - idHex.length)}${idHex}`;
	const idBytes = Bytes.fromHexString(padded) as Bytes;
	const combined = new Uint8Array(prefix.length + idBytes.length);
	combined.set(prefix, 0);
	combined.set(idBytes, prefix.length);
	const hash = crypto.keccak256(Bytes.fromUint8Array(combined));
	engagement.escrowId = Bytes.fromUint8Array(hash);

	engagement.save();

	// Create Transaction record
	const txId = `${event.transaction.hash.toHex()}-${event.logIndex.toString()}`;
	const tx = new Transaction(txId);
	tx.type = "ENGAGEMENT_CREATED";
	tx.engagement = engagementId;
	tx.from = event.params.user;
	tx.to = event.params.agentOwner;
	tx.amount = event.params.amount;
	tx.timestamp = event.block.timestamp;
	tx.blockNumber = event.block.number;
	tx.transactionHash = event.transaction.hash;
	tx.save();
}

export function handlePaymentReleased(event: PaymentReleased): void {
	// Update Engagement status
	const engagementId = event.params.engagementId.toString();
	const engagement = Engagement.load(engagementId);

	if (engagement) {
		engagement.status = "COMPLETED";
		engagement.endTime = event.block.timestamp;
		engagement.save();
	}

	// Create Transaction record
	const txId = `${event.transaction.hash.toHex()}-${event.logIndex.toString()}`;
	const tx = new Transaction(txId);
	tx.type = "PAYMENT_RELEASED";
	tx.engagement = engagementId;
	tx.from = event.transaction.from;
	tx.to = event.params.agentOwner;
	tx.amount = event.params.amount;
	tx.timestamp = event.block.timestamp;
	tx.blockNumber = event.block.number;
	tx.transactionHash = event.transaction.hash;
	tx.save();
}

export function handlePaymentRefunded(event: PaymentRefunded): void {
	// Update Engagement status
	const engagementId = event.params.engagementId.toString();
	const engagement = Engagement.load(engagementId);

	if (engagement) {
		engagement.status = "CANCELLED";
		engagement.endTime = event.block.timestamp;
		engagement.save();
	}

	// Create Transaction record
	const txId = `${event.transaction.hash.toHex()}-${event.logIndex.toString()}`;
	const tx = new Transaction(txId);
	tx.type = "PAYMENT_REFUNDED";
	tx.engagement = engagementId;
	tx.from = event.transaction.from;
	tx.to = event.params.user;
	tx.amount = event.params.amount;
	tx.timestamp = event.block.timestamp;
	tx.blockNumber = event.block.number;
	tx.transactionHash = event.transaction.hash;
	tx.save();
}
