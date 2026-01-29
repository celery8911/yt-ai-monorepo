import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import type { Dispute as PrismaDispute } from "@prisma/client";
import { Dispute, Vote } from "../common/types";
import { generateId, nowIso, toNumber } from "../common/utils";
import { ethers } from "ethers";
import { PrismaService } from "../prisma/prisma.service";
import { ChainStatusService } from "../chain-status/chain-status.service";
import { InitiateDisputeDto, VoteDto } from "./dao.dto";

@Injectable()
export class DaoService {
	private readonly disputes: Dispute[] = [];

	// ✅ 不要在构造时固定住 env 判断（避免模块启动顺序导致永远走错分支）
	private get useDatabase() {
		return Boolean(process.env.DATABASE_URL);
	}

	constructor(
		private readonly prisma: PrismaService,
		private readonly chainStatusService: ChainStatusService,
	) {}

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
			resolvedAt: dispute.resolvedAt
				? dispute.resolvedAt.toISOString()
				: undefined,
		};
	}

	private isBytes32(value?: string | null) {
		return Boolean(value && ethers.isHexString(value, 32));
	}

	private toIsoFromSeconds(value?: string | null) {
		if (!value) return undefined;
		const seconds = Number(value);
		if (!Number.isFinite(seconds)) return undefined;
		return new Date(seconds * 1000).toISOString();
	}

	private resolveChainStatus(status: string, totalVoters: number) {
		if (status === "OPEN" && totalVoters > 0) return "VOTING";
		return status as Dispute["status"];
	}

	private mapChainDispute(record: {
		id: string;
		jobId: string;
		escrowId: string;
		initiator: string;
		status: string;
		votesFor: number;
		votesAgainst: number;
		totalVoters: number;
		createdAt: string;
		resolvedAt?: string | null;
		resolvedOutcome?: string | null;
	}): Dispute {
		return {
			id: record.id,
			jobId: record.jobId,
			escrowId: record.escrowId,
			initiator: record.initiator,
			status: this.resolveChainStatus(record.status, record.totalVoters),
			votesFor: record.votesFor ?? 0,
			votesAgainst: record.votesAgainst ?? 0,
			totalWeight: record.totalVoters ?? 0,
			resolvedOutcome: record.resolvedOutcome
				? (record.resolvedOutcome as Dispute["resolvedOutcome"])
				: undefined,
			createdAt: this.toIsoFromSeconds(record.createdAt) ?? nowIso(),
			resolvedAt: this.toIsoFromSeconds(record.resolvedAt),
		};
	}

	private mapChainVote(record: {
		id: string;
		disputeId: string;
		voter: string;
		support: boolean;
		createdAt: string;
	}): Vote {
		return {
			id: record.id,
			disputeId: record.disputeId,
			voter: record.voter,
			vote: record.support ? "approve" : "reject",
			weight: 1,
			createdAt: this.toIsoFromSeconds(record.createdAt) ?? nowIso(),
		};
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
			let escrowId = job?.escrowId ?? "";
			if (!job && !inputEscrowId) {
				throw new NotFoundException("Job not found");
			}
			if (!escrowId) {
				escrowId = inputEscrowId ?? "";
			}
			if (!escrowId) {
				throw new BadRequestException("Escrow id is required");
			}
			if (inputEscrowId && escrowId !== inputEscrowId) {
				throw new BadRequestException("Escrow id does not match job");
			}

			const escrow = await this.prisma.escrow.findUnique({
				where: { id: escrowId },
			});
			if (!escrow) {
				if (!inputEscrowId) {
					throw new NotFoundException("Escrow not found");
				}
			} else if (job && escrow.jobId !== jobId) {
				throw new BadRequestException("Escrow does not belong to job");
			}

			const created = await this.prisma.dispute.create({
				data: {
					id: generateId("dispute"),
					jobId,
					escrowId,
					initiator,
					reason: payload.reason,
					status: "OPEN",
				},
			});

			// ✅ 关键：你之前 SQL 是 join on j."disputeId" = d.id
			// 所以创建 dispute 后把 job.disputeId 写回去，避免 DAO 列表查不到
			if (job) {
				try {
					await this.prisma.job.update({
						where: { id: jobId },
						data: { disputeId: created.id },
					});
				} catch {
					// 如果 schema 没有 disputeId 字段或不可写，就忽略
				}
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
			createdAt: nowIso(),
		};
		this.disputes.push(dispute);
		return dispute;
	}

	async vote(payload: VoteDto): Promise<Dispute | undefined> {
		const disputeId =
			payload.disputeId || payload.escrowId || payload.jobId || "";
		if (!disputeId) return undefined;

		const chainDispute =
			await this.chainStatusService.getDisputeById(disputeId);
		if (chainDispute) {
			return this.mapChainDispute(chainDispute);
		}

		if (this.useDatabase) {
			const fallback = await this.prisma.dispute.findFirst({
				where: {
					OR: [
						{ id: disputeId },
						{ escrowId: disputeId },
						{ jobId: disputeId },
					],
				},
			});
			return fallback ? this.mapDispute(fallback) : undefined;
		}

		const dispute = this.disputes.find(
			(item) =>
				item.id === disputeId ||
				item.escrowId === disputeId ||
				item.jobId === disputeId,
		);
		return dispute;
	}

	async getDetail(id: string): Promise<{
		dispute?: Dispute & { buyer?: string; seller?: string };
		votes: Vote[];
	}> {
		let dbDispute: PrismaDispute | undefined;
		let memoryDispute: Dispute | undefined;
		if (this.useDatabase) {
			const primary = await this.prisma.dispute.findUnique({ where: { id } });
			const fallback = await this.prisma.dispute.findFirst({
				where: {
					OR: [{ escrowId: id }, { jobId: id }],
				},
				orderBy: { createdAt: "desc" },
			});
			dbDispute = primary ?? fallback ?? undefined;
		} else {
			memoryDispute =
				this.disputes.find((item) => item.id === id) ??
				this.disputes.find((item) => item.escrowId === id) ??
				this.disputes.find((item) => item.jobId === id);
		}

		const chainId = this.isBytes32(id)
			? id
			: (dbDispute?.escrowId ??
				dbDispute?.jobId ??
				memoryDispute?.escrowId ??
				memoryDispute?.jobId);
		const chainDispute = chainId
			? await this.chainStatusService.getDisputeById(chainId)
			: null;

		const chainVotes = chainDispute
			? await this.chainStatusService.getVotesByDispute(chainDispute.id)
			: [];

		const escrow = chainDispute
			? await this.chainStatusService.getEscrowByJobId(chainDispute.escrowId)
			: undefined;
		const escrowAgentOwner = escrow?.escrow?.agent
			? this.normalizeAddress(escrow.escrow.agent)
			: undefined;
		const agentByOwner =
			this.useDatabase && escrowAgentOwner
				? await this.prisma.agent.findFirst({
						where: { owner: { equals: escrowAgentOwner, mode: "insensitive" } },
						select: { name: true },
					})
				: null;

		let engagementAgentId: string | undefined;
		if (this.useDatabase && chainDispute?.initiator) {
			try {
				const { engagements } =
					await this.chainStatusService.getEngagementsByUser(
						chainDispute.initiator,
						{ first: 50, skip: 0 },
					);
				for (const engagement of engagements) {
					const rawAgentId = engagement.agentId?.trim();
					if (!rawAgentId) continue;
					const escrowId =
						engagement.escrowId ??
						ethers.solidityPackedKeccak256(
							["string", "uint256"],
							["engagement", BigInt(engagement.engagementId)],
						);
					if (
						chainDispute.escrowId &&
						escrowId.toLowerCase() === chainDispute.escrowId.toLowerCase()
					) {
						engagementAgentId = rawAgentId;
						break;
					}
				}
			} catch {
				// ignore subgraph errors
			}
		}
		const agentByEngagementId =
			this.useDatabase && engagementAgentId
				? await this.prisma.agent.findFirst({
						where: { id: { equals: engagementAgentId, mode: "insensitive" } },
						select: { name: true },
					})
				: null;

		const dispute = chainDispute
			? {
					...this.mapChainDispute(chainDispute),
					reason: dbDispute?.reason ?? memoryDispute?.reason ?? undefined,
					agentName:
						agentByEngagementId?.name ??
						agentByOwner?.name ??
						engagementAgentId,
				}
			: dbDispute
				? this.mapDispute(dbDispute)
				: memoryDispute;

		const votes = chainVotes.length
			? chainVotes.map((vote) => this.mapChainVote(vote))
			: [];

		return {
			dispute: dispute
				? {
						...dispute,
						buyer: escrow?.escrow?.payer ?? undefined,
						seller: escrow?.escrow?.agent ?? undefined,
					}
				: undefined,
			votes,
		};
	}

	async getDisputes(_address: string, page = 1, limit = 10) {
		const skip = (page - 1) * limit;

		try {
			const chainDisputes = await this.chainStatusService.getDisputes({
				first: limit,
				skip,
			});

			if (chainDisputes.length === 0) {
				return {
					data: [],
					pagination: this.buildPagination(page, limit, 0),
				};
			}

			const escrowLookups = await Promise.all(
				chainDisputes.map((dispute) =>
					this.chainStatusService.getEscrowByJobId(dispute.escrowId),
				),
			);
			const escrowById = new Map(
				escrowLookups
					.map((lookup) => lookup.escrow)
					.filter((escrow): escrow is NonNullable<typeof escrow> =>
						Boolean(escrow),
					)
					.map((escrow) => [escrow.id.toLowerCase(), escrow]),
			);
			const escrowOwners = Array.from(
				new Set(
					Array.from(escrowById.values())
						.map((escrow) => escrow.agent)
						.filter(Boolean)
						.map((owner) => this.normalizeAddress(owner)),
				),
			);
			const initiators = Array.from(
				new Set(
					chainDisputes
						.map((dispute) => this.normalizeAddress(dispute.initiator))
						.filter(Boolean),
				),
			);
			const engagementAgentIdByEscrowId = new Map<string, string>();
			const engagementAgentIds = new Set<string>();
			await Promise.all(
				initiators.map(async (initiator) => {
					try {
						const { engagements } =
							await this.chainStatusService.getEngagementsByUser(initiator, {
								first: 50,
								skip: 0,
							});
						for (const engagement of engagements) {
							const rawAgentId = engagement.agentId?.trim();
							if (!rawAgentId) continue;
							const escrowId =
								engagement.escrowId ??
								ethers.solidityPackedKeccak256(
									["string", "uint256"],
									["engagement", BigInt(engagement.engagementId)],
								);
							engagementAgentIdByEscrowId.set(
								escrowId.toLowerCase(),
								rawAgentId,
							);
							engagementAgentIds.add(rawAgentId);
						}
					} catch {
						// ignore subgraph errors
					}
				}),
			);
			const agentsByOwner = this.useDatabase
				? await this.prisma.agent.findMany({
						where:
							escrowOwners.length > 0
								? {
										OR: escrowOwners.map((owner) => ({
											owner: { equals: owner, mode: "insensitive" },
										})),
									}
								: undefined,
						select: { owner: true, name: true },
					})
				: [];
			const agentsByEngagementId = this.useDatabase
				? await this.prisma.agent.findMany({
						where:
							engagementAgentIds.size > 0
								? {
										OR: Array.from(engagementAgentIds).map((agentId) => ({
											id: { equals: agentId, mode: "insensitive" },
										})),
									}
								: undefined,
						select: { id: true, name: true },
					})
				: [];
			const agentNameByOwner = new Map(
				agentsByOwner.map((agent) => [
					this.normalizeAddress(agent.owner),
					agent.name,
				]),
			);
			const agentNameById = new Map(
				agentsByEngagementId.map((agent) => [
					agent.id.toLowerCase(),
					agent.name,
				]),
			);

			const dbDisputes = this.useDatabase
				? await this.prisma.dispute.findMany({
						where: {
							OR: [
								{ escrowId: { in: chainDisputes.map((d) => d.escrowId) } },
								{ jobId: { in: chainDisputes.map((d) => d.jobId) } },
							],
						},
					})
				: this.disputes.filter((item) =>
						chainDisputes.some(
							(dispute) =>
								dispute.escrowId === item.escrowId ||
								dispute.jobId === item.jobId,
						),
					);
			const dbByEscrowId = new Map(
				dbDisputes
					.filter((item) => this.isBytes32(item.escrowId))
					.map((item) => [item.escrowId.toLowerCase(), item]),
			);
			const dbByJobId = new Map(dbDisputes.map((item) => [item.jobId, item]));

			const normalizedUser = this.normalizeAddress(_address);

			const data = chainDisputes.map((d) => {
				const mapped = this.mapChainDispute(d);
				const escrow = escrowById.get(d.escrowId.toLowerCase());
				const db =
					dbByEscrowId.get(d.escrowId.toLowerCase()) ?? dbByJobId.get(d.jobId);
				const agentName = escrow?.agent
					? agentNameByOwner.get(this.normalizeAddress(escrow.agent))
					: undefined;
				const engagementAgentId = engagementAgentIdByEscrowId.get(
					d.escrowId.toLowerCase(),
				);
				const engagementAgentName = engagementAgentId
					? agentNameById.get(engagementAgentId.toLowerCase())
					: undefined;

				let role: "BUYER" | "SELLER" | "UNKNOWN" | "INITIATOR" = "UNKNOWN";
				if (normalizedUser && mapped.initiator === normalizedUser) {
					role = "INITIATOR";
				} else if (
					normalizedUser &&
					escrow?.payer &&
					this.normalizeAddress(escrow.payer) === normalizedUser
				) {
					role = "BUYER";
				} else if (
					normalizedUser &&
					escrow?.agent &&
					this.normalizeAddress(escrow.agent) === normalizedUser
				) {
					role = "SELLER";
				}

				return {
					...mapped,
					reason: db?.reason ?? undefined,
					role,
					agentName: engagementAgentName ?? agentName ?? engagementAgentId,
					jobTitle: undefined,
					buyer: escrow?.payer ?? undefined,
					seller: escrow?.agent ?? undefined,
					escrowAmount: escrow?.amount ?? undefined,
					currency: escrow?.currency ?? undefined,
				};
			});

			const total = skip + data.length;
			return {
				data,
				pagination: this.buildPagination(page, limit, total),
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
			totalPages: Math.ceil(total / limit),
		};
	}
}
