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

const escrowsByPayerQuery = `
  query EscrowsByPayer($payer: Bytes!, $statuses: [String!]) {
    escrows(
      where: { payer: $payer, status_in: $statuses }
      first: 50
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

const escrowsByPayerAllQuery = `
  query EscrowsByPayerAll($payer: Bytes!) {
    escrows(
      where: { payer: $payer }
      first: 50
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

const disputeByIdQuery = `
  query DisputeById($id: ID!) {
    dispute(id: $id) {
      id
      jobId
      escrowId
      initiator
      status
      votesFor
      votesAgainst
      totalVoters
      createdAt
      resolvedAt
      resolvedOutcome
    }
  }
`;

const disputesQuery = `
  query Disputes($first: Int!, $skip: Int!) {
    disputes(
      first: $first
      skip: $skip
      orderBy: createdAt
      orderDirection: desc
    ) {
      id
      jobId
      escrowId
      initiator
      status
      votesFor
      votesAgainst
      totalVoters
      createdAt
      resolvedAt
      resolvedOutcome
    }
  }
`;

const votesByDisputeQuery = `
  query VotesByDispute($disputeId: ID!, $first: Int!, $skip: Int!) {
    votes(
      where: { disputeId: $disputeId }
      first: $first
      skip: $skip
      orderBy: createdAt
      orderDirection: asc
    ) {
      id
      disputeId
      voter
      support
      cost
      createdAt
    }
  }
`;

const cbtTransfersByAddressQuery = `
  query CbtTransfersByAddress($address: Bytes!, $first: Int!, $skip: Int!) {
    tokenTransfers(
      where: { or: [{ from: $address }, { to: $address }] }
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      from
      to
      amount
      timestamp
      transactionHash
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

type DisputeRecord = {
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
};

type DisputeByIdResponse = { dispute: DisputeRecord | null };

type DisputesResponse = { disputes: DisputeRecord[] };

type VoteRecord = {
	id: string;
	disputeId: string;
	voter: string;
	support: boolean;
	cost: string;
	createdAt: string;
};

type VotesByDisputeResponse = { votes: VoteRecord[] };

type TokenTransferRecord = {
	id: string;
	from: string;
	to: string;
	amount: string;
	timestamp: string;
	transactionHash: string;
};

type TokenTransfersResponse = { tokenTransfers: TokenTransferRecord[] };

const ACTIVE_STATUSES = ["LOCKED", "DISPUTED", "FROZEN"] as const;

type ActiveStatus = (typeof ACTIVE_STATUSES)[number];

const engagementByIdQuery = `
  query EngagementById($id: ID!) {
    engagement(id: $id) {
      id
      engagementId
      user
      agentId
      agentOwner
      jobId
      escrowId
      purchaseType
      totalPaid
      startTime
      endTime
      status
      transactions {
        id
        type
        from
        to
        amount
        timestamp
        blockNumber
        transactionHash
      }
    }
  }
`;

const engagementsByUserQuery = `
  query EngagementsByUser($user: Bytes!, $first: Int!, $skip: Int!) {
    engagements(
      where: { user: $user }
      first: $first
      skip: $skip
      orderBy: startTime
      orderDirection: desc
    ) {
      id
      engagementId
      user
      agentId
      agentOwner
      jobId
      escrowId
      purchaseType
      totalPaid
      startTime
      endTime
      status
    }
  }
`;

const engagementsByAgentIdQuery = `
  query EngagementsByAgentId($agentId: String!, $first: Int!, $skip: Int!) {
    engagements(
      where: { agentId: $agentId }
      first: $first
      skip: $skip
      orderBy: startTime
      orderDirection: desc
    ) {
      id
      engagementId
      user
      agentId
      agentOwner
      jobId
      escrowId
      purchaseType
      totalPaid
      startTime
      endTime
      status
    }
  }
`;

const engagementsByOwnerQuery = `
  query EngagementsByOwner($agentOwner: Bytes!, $first: Int!, $skip: Int!) {
    engagements(
      where: { agentOwner: $agentOwner }
      first: $first
      skip: $skip
      orderBy: startTime
      orderDirection: desc
    ) {
      id
      engagementId
      user
      agentId
      agentOwner
      jobId
      escrowId
      purchaseType
      totalPaid
      startTime
      endTime
      status
    }
  }
`;

type TransactionRecord = {
	id: string;
	type: string;
	from: string;
	to: string | null;
	amount: string;
	timestamp: string;
	blockNumber: string;
	transactionHash: string;
};

type EngagementRecord = {
	id: string;
	engagementId: string;
	user: string;
	agentId: string;
	agentOwner: string;
	jobId: string | null;
	escrowId: string | null;
	purchaseType: string;
	totalPaid: string;
	startTime: string;
	endTime: string | null;
	status: string;
	transactions?: TransactionRecord[];
};

type EngagementByIdResponse = { engagement: EngagementRecord | null };

type EngagementsByUserResponse = { engagements: EngagementRecord[] };

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
		return ethers.getAddress(address).toLowerCase();
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

	async getEngagementById(engagementId: string) {
		const data = await querySubgraph<{ id: string }, EngagementByIdResponse>(
			this.ensureSubgraphUrl(),
			{
				query: engagementByIdQuery,
				variables: { id: engagementId },
			},
		);

		return data.engagement;
	}

	async getEngagementsByUser(
		userAddress: string,
		options: { first?: number; skip?: number } = {},
	) {
		const { first = 20, skip = 0 } = options;
		const normalizedUser = this.normalizeAddress(userAddress);

		const data = await querySubgraph<
			{ user: string; first: number; skip: number },
			EngagementsByUserResponse
		>(this.ensureSubgraphUrl(), {
			query: engagementsByUserQuery,
			variables: {
				user: normalizedUser,
				first,
				skip,
			},
		});

		return {
			user: normalizedUser,
			engagements: data.engagements ?? [],
		};
	}

	async getEngagementsByAgentId(
		agentId: string,
		options: { first?: number; skip?: number } = {},
	) {
		const { first = 20, skip = 0 } = options;

		const data = await querySubgraph<
			{ agentId: string; first: number; skip: number },
			EngagementsByUserResponse
		>(this.ensureSubgraphUrl(), {
			query: engagementsByAgentIdQuery,
			variables: {
				agentId,
				first,
				skip,
			},
		});

		return {
			agentId,
			engagements: data.engagements ?? [],
		};
	}

	async getEngagementsByOwner(
		ownerAddress: string,
		options: { first?: number; skip?: number } = {},
	) {
		const { first = 20, skip = 0 } = options;
		const normalizedOwner = this.normalizeAddress(ownerAddress);

		const data = await querySubgraph<
			{ agentOwner: string; first: number; skip: number },
			EngagementsByUserResponse
		>(this.ensureSubgraphUrl(), {
			query: engagementsByOwnerQuery,
			variables: {
				agentOwner: normalizedOwner,
				first,
				skip,
			},
		});

		return {
			agentOwner: normalizedOwner,
			engagements: data.engagements ?? [],
		};
	}

	async getEscrowsByPayer(payer: string, activeOnly = true) {
		const normalizedPayer = this.normalizeAddress(payer);
		const data = activeOnly
			? await querySubgraph<
					{ payer: string; statuses: string[] },
					EscrowsByAgentResponse
				>(this.ensureSubgraphUrl(), {
					query: escrowsByPayerQuery,
					variables: {
						payer: normalizedPayer,
						statuses: ["LOCKED"],
					},
				})
			: await querySubgraph<{ payer: string }, EscrowsByAgentResponse>(
					this.ensureSubgraphUrl(),
					{
						query: escrowsByPayerAllQuery,
						variables: {
							payer: normalizedPayer,
						},
					},
				);

		const escrows = data.escrows ?? [];
		const activeEscrows = escrows.filter(
			(escrow) => escrow.status === "LOCKED" && !escrow.frozen,
		);

		return {
			payer: normalizedPayer,
			activeOnly,
			escrows: activeOnly ? activeEscrows : escrows,
		};
	}

	async getDisputeById(id: string) {
		const disputeId = this.normalizeJobId(id);
		const data = await querySubgraph<{ id: string }, DisputeByIdResponse>(
			this.ensureSubgraphUrl(),
			{
				query: disputeByIdQuery,
				variables: { id: disputeId },
			},
		);

		return data.dispute;
	}

	async getDisputes(options: { first?: number; skip?: number } = {}) {
		const { first = 20, skip = 0 } = options;
		const data = await querySubgraph<
			{ first: number; skip: number },
			DisputesResponse
		>(this.ensureSubgraphUrl(), {
			query: disputesQuery,
			variables: { first, skip },
		});

		return data.disputes ?? [];
	}

	async getVotesByDispute(
		disputeId: string,
		options: { first?: number; skip?: number } = {},
	) {
		const { first = 100, skip = 0 } = options;
		const normalizedDisputeId = this.normalizeJobId(disputeId);
		const data = await querySubgraph<
			{ disputeId: string; first: number; skip: number },
			VotesByDisputeResponse
		>(this.ensureSubgraphUrl(), {
			query: votesByDisputeQuery,
			variables: { disputeId: normalizedDisputeId, first, skip },
		});

		return data.votes ?? [];
	}

	async getCbtTransfersByAddress(
		address: string,
		options: { first?: number; skip?: number } = {},
	) {
		const { first = 50, skip = 0 } = options;
		const normalizedAddress = this.normalizeAddress(address);
		const data = await querySubgraph<
			{ address: string; first: number; skip: number },
			TokenTransfersResponse
		>(this.ensureSubgraphUrl(), {
			query: cbtTransfersByAddressQuery,
			variables: { address: normalizedAddress, first, skip },
		});

		return {
			address: normalizedAddress,
			transfers: data.tokenTransfers ?? [],
		};
	}
}
