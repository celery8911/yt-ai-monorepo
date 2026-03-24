import { BadRequestException, Injectable } from "@nestjs/common";
import type { Bid as PrismaBid } from "@prisma/client";
import { Bid } from "../common/types";
import { generateId, nowIso, toNumber } from "../common/utils";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBidDto } from "./bids.dto";

@Injectable()
export class BidsService {
	private readonly useDatabase = Boolean(process.env.DATABASE_URL);
	private readonly bids: Bid[] = [];

	constructor(private readonly prisma: PrismaService) {}

	private mapBid(bid: PrismaBid): Bid {
		return {
			id: bid.id,
			jobId: bid.jobId,
			agentId: bid.agentId,
			bidPrice: toNumber(bid.bidPrice) ?? 0,
			currency: bid.currency,
			message: bid.message ?? undefined,
			status: bid.status as Bid["status"],
			createdAt: bid.createdAt.toISOString(),
		};
	}

	async create(jobId: string, payload: CreateBidDto): Promise<Bid> {
		if (payload.bidPrice < 0) {
			throw new BadRequestException("bidPrice must be >= 0");
		}
		const bid: Bid = {
			id: generateId("bid"),
			jobId,
			agentId: payload.agentId,
			bidPrice: payload.bidPrice,
			currency: payload.currency,
			message: payload.message,
			status: "PENDING",
			createdAt: nowIso(),
		};
		if (this.useDatabase) {
			const created = await this.prisma.bid.create({
				data: {
					id: bid.id,
					jobId,
					agentId: payload.agentId,
					bidPrice: payload.bidPrice,
					currency: payload.currency,
					message: payload.message,
					status: bid.status,
				},
			});
			return this.mapBid(created);
		}
		this.bids.push(bid);
		return bid;
	}

	async list(jobId: string): Promise<Bid[]> {
		if (this.useDatabase) {
			const items = await this.prisma.bid.findMany({ where: { jobId } });
			return items.map((item) => this.mapBid(item));
		}
		return this.bids.filter((bid) => bid.jobId === jobId);
	}

	async accept(id: string): Promise<Bid | undefined> {
		if (this.useDatabase) {
			try {
				const updated = await this.prisma.bid.update({
					where: { id },
					data: { status: "ACCEPTED" },
				});
				return this.mapBid(updated);
			} catch {
				return undefined;
			}
		}
		const bid = this.bids.find((item) => item.id === id);
		if (!bid) return undefined;
		bid.status = "ACCEPTED";
		return bid;
	}
}
