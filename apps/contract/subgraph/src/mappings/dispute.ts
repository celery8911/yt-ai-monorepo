import { Bytes } from "@graphprotocol/graph-ts";
import {
	DisputeOpened,
	DisputeResolved,
	VoteCast,
} from "../../generated/DisputeDAO/DisputeDAO";
import { Dispute, Vote } from "../../generated/schema";

function getDisputeId(jobId: Bytes): string {
	return jobId.toHexString();
}

export function handleDisputeOpened(event: DisputeOpened): void {
	const id = getDisputeId(event.params.jobId);
	const dispute = new Dispute(id);
	dispute.jobId = event.params.jobId;
	dispute.escrowId = id;
	dispute.initiator = event.params.initiator;
	dispute.status = "OPEN";
	dispute.votesFor = 0;
	dispute.votesAgainst = 0;
	dispute.totalVoters = 0;
	dispute.createdAt = event.block.timestamp;
	dispute.resolvedAt = null;
	dispute.resolvedOutcome = null;
	dispute.save();
}

export function handleVoteCast(event: VoteCast): void {
	const disputeId = getDisputeId(event.params.jobId);
	const voteId = `${disputeId}-${event.params.voter.toHexString()}`;
	const vote = new Vote(voteId);
	vote.disputeId = disputeId;
	vote.voter = event.params.voter;
	vote.support = event.params.support;
	vote.cost = event.params.cost;
	vote.createdAt = event.block.timestamp;
	vote.save();

	const dispute = Dispute.load(disputeId);
	if (dispute === null) {
		return;
	}
	if (event.params.support) {
		dispute.votesFor += 1;
	} else {
		dispute.votesAgainst += 1;
	}
	dispute.totalVoters += 1;
	dispute.save();
}

export function handleDisputeResolved(event: DisputeResolved): void {
	const id = getDisputeId(event.params.jobId);
	const dispute = Dispute.load(id);
	if (dispute === null) {
		return;
	}
	dispute.status = "RESOLVED";
	dispute.resolvedOutcome = event.params.employerWins ? "EMPLOYER" : "AGENT";
	dispute.resolvedAt = event.block.timestamp;
	dispute.save();
}
