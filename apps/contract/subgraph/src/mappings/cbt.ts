import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Minted } from "../generated/CBT/CBT";
import { Treasury, Wallet } from "../generated/schema";

const TREASURY_ID = "treasury";

function getWalletId(owner: Bytes): string {
  return owner.toHexString();
}

export function handleMinted(event: Minted): void {
  const walletId = getWalletId(event.params.buyer);
  let wallet = Wallet.load(walletId);
  if (wallet === null) {
    wallet = new Wallet(walletId);
    wallet.balance = BigInt.zero();
    wallet.lockedAmount = BigInt.zero();
    wallet.totalEarnings = BigInt.zero();
    wallet.totalSpent = BigInt.zero();
  }
  wallet.balance = wallet.balance.plus(event.params.cbtOut);
  wallet.updatedAt = event.block.timestamp;
  wallet.save();

  let treasury = Treasury.load(TREASURY_ID);
  if (treasury === null) {
    treasury = new Treasury(TREASURY_ID);
    treasury.ethCollected = BigInt.zero();
    treasury.cbtFeesCollected = BigInt.zero();
  }
  treasury.ethCollected = treasury.ethCollected.plus(event.params.ethIn);
  treasury.updatedAt = event.block.timestamp;
  treasury.save();
}
