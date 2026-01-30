import { BadRequestException, Injectable } from "@nestjs/common";
import type { Wallet as PrismaWallet } from "@prisma/client";
import { Escrow, Wallet } from "../common/types";
import { generateId, nowIso, toNumber } from "../common/utils";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEscrowDto, DepositDto } from "./wallet.dto";

@Injectable()
export class WalletService {
	private readonly useDatabase = Boolean(process.env.DATABASE_URL);
	private readonly wallets = new Map<string, Wallet>();
	private readonly escrows: Escrow[] = [];

	constructor(private readonly prisma: PrismaService) {}

	private mapWallet(wallet: PrismaWallet): Wallet {
		return {
			address: wallet.address,
			balance: toNumber(wallet.balance) ?? 0,
			lockedAmount: toNumber(wallet.lockedAmount) ?? 0,
			totalEarnings: toNumber(wallet.totalEarnings) ?? 0,
			totalSpent: toNumber(wallet.totalSpent) ?? 0,
			updatedAt: wallet.updatedAt.toISOString(),
		};
	}

	private mapEscrow(escrow: any): Escrow {
		return {
			id: escrow.id,
			escrowId: escrow.escrowId,
			engagementId: escrow.engagementId,
			jobId: escrow.jobId ?? null,
			payer: escrow.payer,
			amount: toNumber(escrow.amount) ?? 0,
			currency: escrow.currency,
			status: escrow.status as Escrow["status"],
			releaseTo: escrow.releaseTo ?? undefined,
			createdAt: escrow.createdAt.toISOString(),
			releasedAt: escrow.releasedAt
				? escrow.releasedAt.toISOString()
				: undefined,
		};
	}

	async deposit(payload: DepositDto): Promise<Wallet> {
		if (payload.amount < 0) {
			throw new BadRequestException("amount must be >= 0");
		}
		if (this.useDatabase) {
			const wallet = await this.prisma.wallet.upsert({
				where: { address: payload.address },
				update: {
					balance: { increment: payload.amount },
					updatedAt: new Date(),
				},
				create: {
					address: payload.address,
					balance: payload.amount,
					lockedAmount: 0,
					totalEarnings: 0,
					totalSpent: 0,
				},
			});
			return this.mapWallet(wallet);
		}
		const wallet = this.getOrCreate(payload.address);
		wallet.balance += payload.amount;
		wallet.updatedAt = nowIso();
		return wallet;
	}

	async createEscrow(payload: CreateEscrowDto): Promise<Escrow> {
		if (payload.amount < 0) {
			throw new BadRequestException("amount must be >= 0");
		}
		const escrow: Escrow = {
			id: generateId("escrow"),
			escrowId: payload.escrowId,
			engagementId: payload.engagementId,
			jobId: payload.jobId ?? null,
			payer: payload.payer,
			amount: payload.amount,
			currency: payload.currency,
			status: "LOCKED",
			releaseTo: payload.releaseTo,
			createdAt: nowIso(),
		};
		if (this.useDatabase) {
			const [created] = await this.prisma.$transaction([
				this.prisma.escrow.create({
					data: {
						id: escrow.id,
						escrowId: payload.escrowId,
						engagementId: payload.engagementId,
						jobId: payload.jobId ?? null,
						payer: payload.payer,
						amount: payload.amount,
						currency: payload.currency,
						status: escrow.status as any,
						releaseTo: payload.releaseTo,
					} as any,
				}),
				this.prisma.wallet.upsert({
					where: { address: payload.payer },
					update: {
						balance: { decrement: payload.amount },
						lockedAmount: { increment: payload.amount },
						totalSpent: { increment: payload.amount },
						updatedAt: new Date(),
					},
					create: {
						address: payload.payer,
						balance: 0,
						lockedAmount: payload.amount,
						totalEarnings: 0,
						totalSpent: payload.amount,
					},
				}),
			]);
			return this.mapEscrow(created);
		}
		const wallet = this.getOrCreate(payload.payer);
		wallet.lockedAmount += payload.amount;
		wallet.balance = Math.max(0, wallet.balance - payload.amount);
		wallet.totalSpent += payload.amount;
		wallet.updatedAt = nowIso();
		this.escrows.push(escrow);
		return escrow;
	}

	async release(escrowId: string): Promise<Escrow | undefined> {
		if (this.useDatabase) {
			try {
				const escrow = await this.prisma.escrow.findUnique({
					where: { id: escrowId },
				});
				if (!escrow) return undefined;
				const updated = await this.prisma.$transaction(async (tx) => {
					const result = await tx.escrow.update({
						where: { id: escrowId },
						data: { status: "RELEASED", releasedAt: new Date() },
					});
					await tx.wallet.update({
						where: { address: escrow.payer },
						data: {
							lockedAmount: { decrement: escrow.amount },
							updatedAt: new Date(),
						},
					});
					if (escrow.releaseTo) {
						await tx.wallet.upsert({
							where: { address: escrow.releaseTo },
							update: {
								balance: { increment: escrow.amount },
								totalEarnings: { increment: escrow.amount },
								updatedAt: new Date(),
							},
							create: {
								address: escrow.releaseTo,
								balance: escrow.amount,
								lockedAmount: 0,
								totalEarnings: escrow.amount,
								totalSpent: 0,
							},
						});
					}
					return result;
				});
				return this.mapEscrow(updated);
			} catch {
				return undefined;
			}
		}
		const escrow = this.escrows.find((item) => item.id === escrowId);
		if (!escrow) return undefined;
		escrow.status = "RELEASED";
		escrow.releasedAt = nowIso();
		const payerWallet = this.getOrCreate(escrow.payer);
		payerWallet.lockedAmount = Math.max(
			0,
			payerWallet.lockedAmount - escrow.amount,
		);
		payerWallet.updatedAt = nowIso();
		if (escrow.releaseTo) {
			const agentWallet = this.getOrCreate(escrow.releaseTo);
			agentWallet.balance += escrow.amount;
			agentWallet.totalEarnings += escrow.amount;
			agentWallet.updatedAt = nowIso();
		}
		return escrow;
	}

	async balance(address: string): Promise<Wallet> {
		if (this.useDatabase) {
			const wallet = await this.prisma.wallet.findUnique({
				where: { address },
			});
			if (wallet) return this.mapWallet(wallet);
			const created = await this.prisma.wallet.create({
				data: {
					address,
					balance: 0,
					lockedAmount: 0,
					totalEarnings: 0,
					totalSpent: 0,
				},
			});
			return this.mapWallet(created);
		}
		return this.getOrCreate(address);
	}

	async listEscrows(): Promise<Escrow[]> {
		if (this.useDatabase) {
			const escrows = await this.prisma.escrow.findMany();
			return escrows.map((item) => this.mapEscrow(item));
		}
		return this.escrows;
	}

	private getOrCreate(address: string): Wallet {
		const existing = this.wallets.get(address);
		if (existing) return existing;
		const wallet: Wallet = {
			address,
			balance: 0,
			lockedAmount: 0,
			totalEarnings: 0,
			totalSpent: 0,
			updatedAt: nowIso(),
		};
		this.wallets.set(address, wallet);
		return wallet;
	}
}
