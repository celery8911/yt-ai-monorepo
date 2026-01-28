import { BigInt as GraphBigInt, Bytes } from "@graphprotocol/graph-ts";
import { Minted, Transfer } from "../../generated/CBT/CBT";
import { TokenTransfer, Treasury, Wallet } from "../../generated/schema";

const TREASURY_ID = "treasury";

function getWalletId(owner: Bytes): string {
	return owner.toHexString();
}

export function handleMinted(event: Minted): void {
	const walletId = getWalletId(event.params.buyer);
	let wallet = Wallet.load(walletId);
	if (wallet === null) {
		wallet = new Wallet(walletId);
		wallet.balance = GraphBigInt.zero();
		wallet.lockedAmount = GraphBigInt.zero();
		wallet.totalEarnings = GraphBigInt.zero();
		wallet.totalSpent = GraphBigInt.zero();
	}
	wallet.balance = wallet.balance.plus(event.params.cbtOut);
	wallet.updatedAt = event.block.timestamp;
	wallet.save();

	let treasury = Treasury.load(TREASURY_ID);
	if (treasury === null) {
		treasury = new Treasury(TREASURY_ID);
		treasury.ethCollected = GraphBigInt.zero();
		treasury.cbtFeesCollected = GraphBigInt.zero();
	}
	treasury.ethCollected = treasury.ethCollected.plus(event.params.ethIn);
	treasury.updatedAt = event.block.timestamp;
	treasury.save();
}

export function handleTransfer(event: Transfer): void {
	const transferId = event.transaction.hash
		.toHexString()
		.concat("-")
		.concat(event.logIndex.toString());
	const transfer = new TokenTransfer(transferId);
	transfer.from = event.params.from;
	transfer.to = event.params.to;
	transfer.amount = event.params.value;
	transfer.timestamp = event.block.timestamp;
	transfer.transactionHash = event.transaction.hash;
	transfer.save();
}
