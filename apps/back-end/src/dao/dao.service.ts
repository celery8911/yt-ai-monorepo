import { BadRequestException, Injectable } from "@nestjs/common";
import type { Dispute as PrismaDispute, Vote as PrismaVote } from "@prisma/client";
import { Dispute, Vote } from "../common/types";
import { generateId, nowIso, toNumber } from "../common/utils";
import { PrismaService } from "../prisma/prisma.service";
import { InitiateDisputeDto, VoteDto } from "./dao.dto";

@Injectable()
export class DaoService {
  private readonly useDatabase = Boolean(process.env.DATABASE_URL);
  private readonly disputes: Dispute[] = [];
  private readonly votes: Vote[] = [];

  constructor(private readonly prisma: PrismaService) {}

  private mapDispute(dispute: PrismaDispute): Dispute {
    return {
      id: dispute.id,
      jobId: dispute.jobId,
      escrowId: dispute.escrowId,
      initiator: dispute.initiator,
      reason: dispute.reason ?? undefined,
      status: dispute.status as Dispute["status"],
      votesFor: dispute.votesFor,
      votesAgainst: dispute.votesAgainst,
      totalWeight: toNumber(dispute.totalWeight) ?? 0,
      resolvedOutcome: dispute.resolvedOutcome
        ? (dispute.resolvedOutcome as Dispute["resolvedOutcome"])
        : undefined,
      createdAt: dispute.createdAt.toISOString(),
      resolvedAt: dispute.resolvedAt ? dispute.resolvedAt.toISOString() : undefined
    };
  }

  private mapVote(vote: PrismaVote): Vote {
    return {
      id: vote.id,
      disputeId: vote.disputeId,
      voter: vote.voter,
      vote: vote.vote as Vote["vote"],
      weight: toNumber(vote.weight) ?? 0,
      createdAt: vote.createdAt.toISOString()
    };
  }

  async initiate(payload: InitiateDisputeDto): Promise<Dispute> {
    const dispute: Dispute = {
      id: generateId("dispute"),
      jobId: payload.jobId,
      escrowId: payload.escrowId ?? "",
      initiator: payload.initiator,
      reason: payload.reason,
      status: "OPEN",
      votesFor: 0,
      votesAgainst: 0,
      totalWeight: 0,
      createdAt: nowIso()
    };
    if (this.useDatabase) {
      const created = await this.prisma.dispute.create({
        data: {
          id: dispute.id,
          jobId: payload.jobId,
          escrowId: payload.escrowId ?? "",
          initiator: payload.initiator,
          reason: payload.reason,
          status: dispute.status
        }
      });
      return this.mapDispute(created);
    }
    this.disputes.push(dispute);
    return dispute;
  }

  async vote(payload: VoteDto): Promise<Dispute | undefined> {
    if (payload.weight < 0) {
      throw new BadRequestException("weight must be >= 0");
    }
    if (this.useDatabase) {
      const dispute = await this.prisma.dispute.findUnique({ where: { id: payload.disputeId } });
      if (!dispute) return undefined;
      const updated = await this.prisma.$transaction(async (tx) => {
        await tx.vote.create({
          data: {
            id: generateId("vote"),
            disputeId: payload.disputeId,
            voter: payload.voter,
            vote: payload.vote,
            weight: payload.weight
          }
        });
        const deltaFor = payload.vote === "approve" ? 1 : 0;
        const deltaAgainst = payload.vote === "reject" ? 1 : 0;
        return tx.dispute.update({
          where: { id: payload.disputeId },
          data: {
            votesFor: { increment: deltaFor },
            votesAgainst: { increment: deltaAgainst },
            totalWeight: { increment: payload.weight },
            status: "VOTING"
          }
        });
      });
      return this.mapDispute(updated);
    }
    const dispute = this.disputes.find((item) => item.id === payload.disputeId);
    if (!dispute) return undefined;
    const vote: Vote = {
      id: generateId("vote"),
      disputeId: payload.disputeId,
      voter: payload.voter,
      vote: payload.vote,
      weight: payload.weight,
      createdAt: nowIso()
    };
    this.votes.push(vote);
    if (payload.vote === "approve") {
      dispute.votesFor += 1;
    } else {
      dispute.votesAgainst += 1;
    }
    dispute.totalWeight += payload.weight;
    dispute.status = "VOTING";
    return dispute;
  }

  async getDetail(id: string): Promise<{ dispute?: Dispute; votes: Vote[] }> {
    if (this.useDatabase) {
      const [dispute, votes] = await this.prisma.$transaction([
        this.prisma.dispute.findUnique({ where: { id } }),
        this.prisma.vote.findMany({ where: { disputeId: id } })
      ]);
      return {
        dispute: dispute ? this.mapDispute(dispute) : undefined,
        votes: votes.map((vote) => this.mapVote(vote))
      };
    }
    const dispute = this.disputes.find((item) => item.id === id);
    const votes = this.votes.filter((vote) => vote.disputeId === id);
    return { dispute, votes };
  }
}
