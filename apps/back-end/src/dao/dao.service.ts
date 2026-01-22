import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Dispute as PrismaDispute, Vote as PrismaVote } from "@prisma/client";
import { Dispute, Vote } from "../common/types";
import { generateId, nowIso, toNumber } from "../common/utils";
import { PrismaService } from "../prisma/prisma.service";
import { WalletService } from "../wallet/wallet.service";
import { InitiateDisputeDto, VoteDto } from "./dao.dto";

@Injectable()
export class DaoService {
  private readonly disputes: Dispute[] = [];
  private readonly votes: Vote[] = [];
  private readonly defaultVotingPeriodHours = 48;
  private readonly defaultMinVoters = 3;

  // ✅ 不要在构造时固定住 env 判断（避免模块启动顺序导致永远走错分支）
  private get useDatabase() {
    return Boolean(process.env.DATABASE_URL);
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService
  ) { }

  private normalizeAddress(address?: string | null) {
    return (address ?? "").trim();
  }

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

  private get votingPeriodMs() {
    const hours = Number(process.env.DAO_VOTING_PERIOD_HOURS ?? this.defaultVotingPeriodHours);
    if (!Number.isFinite(hours) || hours <= 0) {
      return this.defaultVotingPeriodHours * 60 * 60 * 1000;
    }
    return hours * 60 * 60 * 1000;
  }

  private get minVoters() {
    const minVoters = Number(process.env.DAO_MIN_VOTERS ?? this.defaultMinVoters);
    if (!Number.isFinite(minVoters) || minVoters <= 0) {
      return this.defaultMinVoters;
    }
    return Math.floor(minVoters);
  }

  private isDisputeExpired(dispute: PrismaDispute) {
    const createdAt = dispute.createdAt?.getTime();
    if (!createdAt) return false;
    return Date.now() > createdAt + this.votingPeriodMs;
  }

  private async resolveDisputeIfNeeded(dispute: PrismaDispute): Promise<PrismaDispute> {
    if (dispute.status === "RESOLVED") return dispute;
    if (!this.isDisputeExpired(dispute)) return dispute;

    const job = await this.prisma.job.findUnique({
      where: { id: dispute.jobId },
      select: {
        id: true,
        createdBy: true,
        selectedAgentId: true
      }
    });
    if (!job) throw new NotFoundException("Job not found");

    const totalVoters = dispute.votesFor + dispute.votesAgainst;
    const employerWins =
      totalVoters < this.minVoters ||
      dispute.votesFor === dispute.votesAgainst ||
      dispute.votesFor > dispute.votesAgainst;

    const escrow = await this.prisma.escrow.findUnique({ where: { id: dispute.escrowId } });
    if (!escrow) throw new NotFoundException("Escrow not found");

    const winnerAddress = employerWins ? job.createdBy : job.selectedAgentId;
    if (!winnerAddress) {
      throw new BadRequestException("Winner address not available");
    }

    if (escrow.status !== "RELEASED") {
      await this.prisma.escrow.update({
        where: { id: escrow.id },
        data: { releaseTo: winnerAddress }
      });
      await this.walletService.release(escrow.id);
    }

    const resolved = await this.prisma.dispute.update({
      where: { id: dispute.id },
      data: {
        status: "RESOLVED",
        resolvedOutcome: employerWins ? "REFUND_PAYER" : "RELEASE_TO_AGENT",
        resolvedAt: new Date()
      }
    });

    return resolved;
  }

  async initiate(payload: InitiateDisputeDto): Promise<Dispute> {
    const initiator = this.normalizeAddress(payload.initiator);
    const jobId = payload.jobId?.trim();
    const inputEscrowId = payload.escrowId?.trim();

    if (!jobId) {
      throw new BadRequestException("Job id is required");
    }

    if (this.useDatabase) {
      const job = await this.prisma.job.findUnique({ where: { id: jobId } });
      if (!job) throw new NotFoundException("Job not found");

      const escrowId = job.escrowId ?? "";
      if (!escrowId) {
        throw new BadRequestException("Job has no escrow id");
      }
      if (inputEscrowId && escrowId !== inputEscrowId) {
        throw new BadRequestException("Escrow id does not match job");
      }

      const escrow = await this.prisma.escrow.findUnique({ where: { id: escrowId } });
      if (!escrow) throw new NotFoundException("Escrow not found");
      if (escrow.jobId !== jobId) {
        throw new BadRequestException("Escrow does not belong to job");
      }

      const created = await this.prisma.dispute.create({
        data: {
          id: generateId("dispute"),
          jobId,
          escrowId,
          initiator,
          reason: payload.reason,
          status: "OPEN"
        }
      });

      // ✅ 关键：你之前 SQL 是 join on j."disputeId" = d.id
      // 所以创建 dispute 后把 job.disputeId 写回去，避免 DAO 列表查不到
      try {
        await this.prisma.job.update({
          where: { id: jobId },
          data: { disputeId: created.id }
        });
      } catch {
        // 如果 schema 没有 disputeId 字段或不可写，就忽略
      }

      return this.mapDispute(created);
    }

    if (!inputEscrowId) {
      throw new BadRequestException("Escrow id is required");
    }

    const dispute: Dispute = {
      id: generateId("dispute"),
      jobId,
      escrowId: inputEscrowId,
      initiator,
      reason: payload.reason,
      status: "OPEN",
      votesFor: 0,
      votesAgainst: 0,
      totalWeight: 0,
      createdAt: nowIso()
    };
    this.disputes.push(dispute);
    return dispute;
  }

  async vote(payload: VoteDto): Promise<Dispute | undefined> {
    const voter = this.normalizeAddress(payload.voter);

    if (this.useDatabase) {
      const dispute = await this.prisma.dispute.findUnique({ where: { id: payload.disputeId } });
      if (!dispute) return undefined;

      const resolvedDispute = await this.resolveDisputeIfNeeded(dispute);
      if (resolvedDispute.status === "RESOLVED") {
        throw new BadRequestException("Voting is closed");
      }

      const job = await this.prisma.job.findUnique({
        where: { id: resolvedDispute.jobId },
        select: { createdBy: true, selectedAgentId: true }
      });
      if (!job) throw new NotFoundException("Job not found");

      const normalizedVoter = this.normalizeAddress(voter);
      if (
        normalizedVoter === this.normalizeAddress(job.createdBy) ||
        normalizedVoter === this.normalizeAddress(job.selectedAgentId)
      ) {
        throw new BadRequestException("Buyer or seller cannot vote");
      }
      if (normalizedVoter === this.normalizeAddress(resolvedDispute.initiator)) {
        throw new BadRequestException("Initiator cannot vote");
      }

      const existing = await this.prisma.vote.findFirst({
        where: { disputeId: payload.disputeId, voter }
      });
      if (existing) throw new ConflictException("Already voted");

      const updated = await this.prisma.$transaction(async (tx) => {
        await tx.vote.create({
          data: {
            id: generateId("vote"),
            disputeId: payload.disputeId,
            voter,
            vote: payload.vote,
            weight: 1
          }
        });

        const deltaFor = payload.vote === "approve" ? 1 : 0;
        const deltaAgainst = payload.vote === "reject" ? 1 : 0;

        return tx.dispute.update({
          where: { id: payload.disputeId },
          data: {
            votesFor: { increment: deltaFor },
            votesAgainst: { increment: deltaAgainst },
            totalWeight: { increment: 1 },
            status: "VOTING"
          }
        });
      });

      return this.mapDispute(updated);
    }

    const dispute = this.disputes.find((item) => item.id === payload.disputeId);
    if (!dispute) return undefined;
    if (dispute.status === "RESOLVED") {
      throw new BadRequestException("Voting is closed");
    }
    const normalizedVoter = this.normalizeAddress(voter);
    if (normalizedVoter === this.normalizeAddress(dispute.initiator)) {
      throw new BadRequestException("Initiator cannot vote");
    }
    const createdAt = new Date(dispute.createdAt).getTime();
    if (Number.isFinite(createdAt) && Date.now() > createdAt + this.votingPeriodMs) {
      const totalVoters = dispute.votesFor + dispute.votesAgainst;
      const employerWins =
        totalVoters < this.minVoters ||
        dispute.votesFor === dispute.votesAgainst ||
        dispute.votesFor > dispute.votesAgainst;
      dispute.status = "RESOLVED";
      dispute.resolvedOutcome = employerWins ? "REFUND_PAYER" : "RELEASE_TO_AGENT";
      dispute.resolvedAt = nowIso();
      throw new BadRequestException("Voting is closed");
    }

    const duplicateVote = this.votes.find(
      (item) => item.disputeId === payload.disputeId && item.voter === voter
    );
    if (duplicateVote) throw new ConflictException("Already voted");

    const vote: Vote = {
      id: generateId("vote"),
      disputeId: payload.disputeId,
      voter,
      vote: payload.vote,
      weight: 1,
      createdAt: nowIso()
    };

    this.votes.push(vote);

    if (payload.vote === "approve") dispute.votesFor += 1;
    else dispute.votesAgainst += 1;

    dispute.totalWeight += 1;
    dispute.status = "VOTING";
    return dispute;
  }

  async getDetail(id: string): Promise<{ dispute?: (Dispute & { buyer?: string; seller?: string }); votes: Vote[] }> {
    if (this.useDatabase) {
      const [dispute, votes] = await this.prisma.$transaction([
        this.prisma.dispute.findUnique({ where: { id } }),
        this.prisma.vote.findMany({ where: { disputeId: id } })
      ]);
      const resolvedDispute = dispute ? await this.resolveDisputeIfNeeded(dispute) : undefined;
      const job = resolvedDispute
        ? await this.prisma.job.findUnique({
          where: { id: resolvedDispute.jobId },
          select: { createdBy: true, selectedAgentId: true }
        })
        : undefined;
      return {
        dispute: resolvedDispute
          ? {
            ...this.mapDispute(resolvedDispute),
            buyer: job?.createdBy ?? undefined,
            seller: job?.selectedAgentId ?? undefined
          }
          : undefined,
        votes: votes.map((vote) => this.mapVote(vote))
      };
    }

    const dispute = this.disputes.find((item) => item.id === id);
    const votes = this.votes.filter((vote) => vote.disputeId === id);
    return { dispute, votes };
  }

  async getDisputes(address: string, page = 1, limit = 10) {
    const addr = this.normalizeAddress(address);
    const skip = (page - 1) * limit;

    try {
      console.log("========== DAO getDisputes ==========");
      console.log("[address]", address, "normalized =", addr);

      /**
       * 1️⃣ 找所有「和我有关」且已产生 dispute 的 Job
       * - 买方：createdBy = address
       * - 卖方：selectedAgentId = address
       */
      const jobs = await this.prisma.job.findMany({
        where: {
          disputeId: { not: null },
          OR: [
            { createdBy: addr },
            { selectedAgentId: addr }
          ]
        },
        select: {
          id: true,
          title: true,
          createdBy: true,
          selectedAgentId: true,
          disputeId: true
        }
      });

      if (jobs.length === 0) {
        return {
          data: [],
          pagination: this.buildPagination(page, limit, 0)
        };
      }

      /**
       * 2️⃣ 根据 disputeId 查 Dispute
       */
      const disputeIds = jobs.map(j => j.disputeId!).filter(Boolean);

      const [disputes, total] = await Promise.all([
        this.prisma.dispute.findMany({
          where: { id: { in: disputeIds } },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit
        }),
        this.prisma.dispute.count({
          where: { id: { in: disputeIds } }
        })
      ]);

      /**
       * 3️⃣ 组装返回数据（顺便算 role）
       */
      const jobByDisputeId = new Map(
        jobs.map(j => [j.disputeId!, j])
      );

      const resolvedDisputes = await Promise.all(disputes.map((item) => this.resolveDisputeIfNeeded(item)));

      const data = resolvedDisputes.map(d => {
        const job = jobByDisputeId.get(d.id)!;

        const role =
          this.normalizeAddress(job.createdBy) === addr
            ? "BUYER"
            : this.normalizeAddress(job.selectedAgentId) === addr
              ? "SELLER"
              : "UNKNOWN";

        return {
          ...this.mapDispute(d),
          role,
          jobId: job.id,
          jobTitle: job.title,
          buyer: job.createdBy,
          seller: job.selectedAgentId
        };
      });

      return {
        data,
        pagination: this.buildPagination(page, limit, total)
      };
    } catch (err) {
      console.error("========== DAO getDisputes ERROR ==========");
      console.error(err);
      throw err;
    }
  }

  private buildPagination(page: number, limit: number, total: number) {
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }
}
