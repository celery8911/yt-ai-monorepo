import { Injectable } from "@nestjs/common";
import { ethers } from "ethers";
import { querySubgraph } from "../keeper/subgraph.client";

const escrowByIdQuery = `
  query EscrowById($id: ID!) {
    escrow(id: $id) {
      id
      jobId
      payer
      agent
      amount
      serviceFee
      currency
      status
      createdAt
      releaseAt
      releasedAt
      refundedAt
      frozen
    }
  }
`;

const escrowsByAgentQuery = `
  query EscrowsByAgent($agent: Bytes!, $statuses: [String!]) {
    escrows(
      where: { agent: $agent, status_in: $statuses }
      first: 20
      orderBy: createdAt
      orderDirection: desc
    ) {
      id
      jobId
      payer
      agent
      amount
      serviceFee
      currency
      status
      createdAt
      releaseAt
      releasedAt
      refundedAt
      frozen
    }
  }
`;

const escrowsByAgentAllQuery = `
  query EscrowsByAgentAll($agent: Bytes!) {
    escrows(
      where: { agent: $agent }
      first: 20
      orderBy: createdAt
      orderDirection: desc
    ) {
      id
      jobId
      payer
      agent
      amount
      serviceFee
      currency
      status
      createdAt
      releaseAt
      releasedAt
      refundedAt
      frozen
    }
  }
`;

type EscrowRecord = {
	id: string;
	jobId: string;
	payer: string;
	agent: string;
	amount: string;
	serviceFee: string;
	currency: string;
	status: string;
	createdAt: string;
	releaseAt: string;
	releasedAt?: string | null;
	refundedAt?: string | null;
	frozen: boolean;
};

type EscrowByIdResponse = { escrow: EscrowRecord | null };

type EscrowsByAgentResponse = { escrows: EscrowRecord[] };

const ACTIVE_STATUSES = ["LOCKED", "DISPUTED", "FROZEN"] as const;

type ActiveStatus = (typeof ACTIVE_STATUSES)[number];

@Injectable()
export class ChainStatusService {
	private readonly subgraphUrl = process.env.SUBGRAPH_URL || "";

	private ensureSubgraphUrl(): string {
		if (!this.subgraphUrl) {
			throw new Error("SUBGRAPH_URL is not configured");
		}
		return this.subgraphUrl;
	}

	private normalizeJobId(jobId: string): string {
		if (ethers.isHexString(jobId, 32)) {
			return jobId.toLowerCase();
		}
		return ethers.id(jobId);
	}

	private normalizeAddress(address: string): string {
		return ethers.getAddress(address);
	}

	private isActiveStatus(status?: string): status is ActiveStatus {
		return Boolean(status && ACTIVE_STATUSES.includes(status as ActiveStatus));
	}

	async getEscrowByJobId(jobId: string) {
		const jobIdBytes32 = this.normalizeJobId(jobId);
		const data = await querySubgraph<{ id: string }, EscrowByIdResponse>(
			this.ensureSubgraphUrl(),
			{
				query: escrowByIdQuery,
				variables: { id: jobIdBytes32 },
			},
		);

		const escrow = data.escrow;
		return {
			jobId,
			jobIdBytes32,
			isEmployed: this.isActiveStatus(escrow?.status),
			escrow,
		};
	}

	async getEscrowsByAgent(agent: string, activeOnly = true) {
		const normalizedAgent = this.normalizeAddress(agent);
		const data = activeOnly
			? await querySubgraph<
					{ agent: string; statuses: string[] },
					EscrowsByAgentResponse
				>(this.ensureSubgraphUrl(), {
					query: escrowsByAgentQuery,
					variables: {
						agent: normalizedAgent,
						statuses: [...ACTIVE_STATUSES],
					},
				})
			: await querySubgraph<{ agent: string }, EscrowsByAgentResponse>(
					this.ensureSubgraphUrl(),
					{
						query: escrowsByAgentAllQuery,
						variables: {
							agent: normalizedAgent,
						},
					},
				);

		const escrows = data.escrows ?? [];
		const activeEscrows = escrows.filter((escrow) =>
			this.isActiveStatus(escrow.status),
		);

		return {
			agent: normalizedAgent,
			activeOnly,
			isEmployed: activeEscrows.length > 0,
			activeCount: activeEscrows.length,
			escrows,
		};
	}
}
