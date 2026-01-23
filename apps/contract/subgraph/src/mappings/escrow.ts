import { BigInt as GraphBigInt, Bytes } from "@graphprotocol/graph-ts";
import {
	AutoReleaseScheduled,
	AutoReleased,
	EscrowFrozen,
	EscrowRefunded,
	PaymentCreated,
} from "../../generated/Escrow/Escrow";
import { Escrow } from "../../generated/schema";

function getEscrowId(jobId: Bytes): string {
	return jobId.toHexString();
}

export function handlePaymentCreated(event: PaymentCreated): void {
	const id = getEscrowId(event.params.jobId);
	const escrow = new Escrow(id);
	escrow.jobId = event.params.jobId;
	escrow.payer = event.params.payer;
	escrow.agent = event.params.agent;
	escrow.amount = event.params.price;
	escrow.serviceFee = event.params.serviceFee;
	escrow.currency = "CBT";
	escrow.status = "LOCKED";
	escrow.releaseAt = GraphBigInt.zero();
	escrow.createdAt = event.block.timestamp;
	escrow.releasedAt = null;
	escrow.refundedAt = null;
	escrow.frozen = false;
	escrow.save();
}

export function handleAutoReleaseScheduled(event: AutoReleaseScheduled): void {
	const id = getEscrowId(event.params.jobId);
	const escrow = Escrow.load(id);
	if (escrow === null) {
		return;
	}
	escrow.releaseAt = event.params.releaseAt;
	escrow.save();
}

export function handleAutoReleased(event: AutoReleased): void {
	const id = getEscrowId(event.params.jobId);
	const escrow = Escrow.load(id);
	if (escrow === null) {
		return;
	}
	escrow.status = "RELEASED";
	escrow.releasedAt = event.block.timestamp;
	escrow.save();
}

export function handleEscrowFrozen(event: EscrowFrozen): void {
	const id = getEscrowId(event.params.jobId);
	const escrow = Escrow.load(id);
	if (escrow === null) {
		return;
	}
	escrow.status = "FROZEN";
	escrow.frozen = true;
	escrow.save();
}

export function handleEscrowRefunded(event: EscrowRefunded): void {
	const id = getEscrowId(event.params.jobId);
	const escrow = Escrow.load(id);
	if (escrow === null) {
		return;
	}
	escrow.status = "REFUNDED";
	escrow.refundedAt = event.block.timestamp;
	escrow.save();
}
