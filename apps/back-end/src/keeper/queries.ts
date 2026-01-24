export const escrowReadyQuery = `
  query EscrowReady($now: BigInt!, $limit: Int!) {
    escrows(
      where: { status: "LOCKED", releaseAt_lte: $now }
      first: $limit
      orderBy: releaseAt
      orderDirection: asc
    ) {
      id
      jobId
      releaseAt
      status
    }
  }
`;

export const disputeReadyQuery = `
  query DisputeReady($now: BigInt!, $limit: Int!) {
    disputes(
      where: { status: "OPEN", createdAt_lte: $now }
      first: $limit
      orderBy: createdAt
      orderDirection: asc
    ) {
      id
      jobId
      createdAt
      status
    }
  }
`;
