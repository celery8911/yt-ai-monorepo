import { Prisma, PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

const loadEnvIfMissing = () => {
  if (process.env.DATABASE_URL) {
    return;
  }

  const envPath = path.resolve(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const [key, ...rest] = line.split("=");
    if (!key) continue;
    const value = rest.join("=").trim().replace(/^"|"$/g, "");
    if (key && value && !process.env[key]) {
      process.env[key] = value;
    }
  }
};

const decimal = (value: string) => new Prisma.Decimal(value);

const buildJob = (overrides: Partial<Prisma.JobCreateInput>): Prisma.JobCreateInput => ({
  id: randomUUID(),
  title: "Seeded Job",
  description: "Dashboard seed job",
  category: "General",
  tags: [],
  createdBy: "0x0",
  status: "OPEN",
  paymentMethod: "PER_TASK",
  budgetMin: decimal("100"),
  budgetMax: decimal("300"),
  currency: "USD",
  deadlineAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  priority: "MEDIUM",
  requiredSkillLevel: "INTERMEDIATE",
  deliverables: "Report",
  acceptanceCriteria: "Meets requirements",
  autoMatchEnabled: true,
  biddingEnabled: true,
  escrowEnabled: true,
  visibility: "public",
  reviewWindowDays: 7,
  payoutStrategy: "WINNER_TAKE_ALL",
  ...overrides
});

const buildAgent = (overrides: Partial<Prisma.AgentCreateInput>): Prisma.AgentCreateInput => ({
  id: randomUUID(),
  name: "Seed Agent",
  description: "Dashboard seed agent",
  category: "General",
  tags: [],
  endpointUrl: "https://example.com/agent",
  owner: "0x0",
  visibility: "public",
  isActive: true,
  supportedPaymentMethods: ["PER_TASK"],
  pricePerTask: decimal("120"),
  resultBasedMinPrice: decimal("80"),
  minBid: decimal("50"),
  currency: "USD",
  skillLevel: "INTERMEDIATE",
  deliverableFormats: ["REPORT"],
  requiresHumanReviewSupported: false,
  avgResponseTimeMs: 8000,
  successRate: 0.92,
  rating: 4.6,
  ...overrides
});

const buildEscrow = (overrides: Partial<Prisma.EscrowCreateInput>): Prisma.EscrowCreateInput => ({
  id: randomUUID(),
  jobId: randomUUID(),
  payer: "0x0",
  amount: decimal("200"),
  currency: "USD",
  status: "LOCKED",
  ...overrides
});

const buildBill = (overrides: Partial<Prisma.BillCreateInput>): Prisma.BillCreateInput => ({
  id: randomUUID(),
  jobId: randomUUID(),
  agentId: randomUUID(),
  amount: decimal("500"),
  currency: "USD",
  status: "PAID",
  escrowId: null,
  payeeAddress: "0x0",
  payerAddress: "0x0",
  ...overrides
});

const buildDispute = (overrides: Partial<Prisma.DisputeCreateInput>): Prisma.DisputeCreateInput => ({
  id: randomUUID(),
  jobId: randomUUID(),
  escrowId: randomUUID(),
  initiator: "0x0",
  reason: "Quality issue",
  status: "OPEN",
  votesFor: 1,
  votesAgainst: 0,
  totalWeight: decimal("1"),
  resolvedOutcome: null,
  ...overrides
});

const seed = async () => {
  loadEnvIfMissing();
  const prisma = new PrismaClient();
  const address = "0x525e72A8575B4954e47DB5df315d530bbF49Ec59";
  const otherUser = "0x1111111111111111111111111111111111111111";

  const existingSeed = await prisma.job.findFirst({
    where: { createdBy: address, title: "Seed - Market Scan" },
    select: { id: true }
  });
  if (existingSeed) {
    const ownedAgent = await prisma.agent.findFirst({
      where: { owner: address, name: "Sentinel QA" },
      select: { id: true }
    });
    const opsJob = await prisma.job.findFirst({
      where: { title: "Seed - Ops Runbook" },
      select: { id: true, createdBy: true, createdAt: true, currency: true }
    });
    const qaJob = await prisma.job.findFirst({
      where: { title: "Seed - QA Audit" },
      select: { id: true, createdBy: true, createdAt: true, currency: true }
    });
    if (ownedAgent && opsJob) {
      const existingEscrow = await prisma.escrow.findFirst({ where: { jobId: opsJob.id } });
      if (!existingEscrow) {
        await prisma.escrow.create({
          data: buildEscrow({
            jobId: opsJob.id,
            payer: opsJob.createdBy,
            amount: decimal("260"),
            currency: opsJob.currency ?? "USD",
            status: "LOCKED",
            createdAt: opsJob.createdAt
          })
        });
      }
    }
    if (ownedAgent && qaJob) {
      const existingEscrow = await prisma.escrow.findFirst({ where: { jobId: qaJob.id } });
      if (!existingEscrow) {
        await prisma.escrow.create({
          data: buildEscrow({
            jobId: qaJob.id,
            payer: qaJob.createdBy,
            amount: decimal("420"),
            currency: qaJob.currency ?? "USD",
            status: "RELEASED",
            createdAt: qaJob.createdAt,
            releasedAt: new Date()
          })
        });
      }
    }

    console.log("Seed data already exists for address:", address);
    await prisma.$disconnect();
    return;
  }

  const ownedAgentA = buildAgent({
    name: "Sentinel QA",
    owner: address,
    category: "QA",
    skillLevel: "ADVANCED",
    isActive: true,
    pricePerTask: decimal("180")
  });
  const ownedAgentB = buildAgent({
    name: "Ops Pathfinder",
    owner: address,
    category: "Ops",
    skillLevel: "EXPERT",
    isActive: false,
    pricePerTask: decimal("240")
  });
  const externalAgent = buildAgent({
    name: "Nova Synth",
    owner: otherUser,
    category: "Marketing",
    skillLevel: "INTERMEDIATE",
    isActive: true
  });

  const openJob = buildJob({
    title: "Seed - Market Scan",
    createdBy: address,
    status: "OPEN",
    priority: "HIGH",
    budgetMin: decimal("200"),
    budgetMax: decimal("400")
  });
  const inProgressJob = buildJob({
    title: "Seed - Integration QA",
    createdBy: address,
    status: "IN_PROGRESS",
    selectedAgentId: externalAgent.id
  });
  const completedJob = buildJob({
    title: "Seed - Release Report",
    createdBy: address,
    status: "COMPLETED",
    selectedAgentId: externalAgent.id,
    budgetMin: decimal("300"),
    budgetMax: decimal("600")
  });
  const matchingJob = buildJob({
    title: "Seed - Agent Match",
    createdBy: address,
    status: "MATCHING"
  });

  const agentJobActive = buildJob({
    title: "Seed - Ops Runbook",
    createdBy: otherUser,
    status: "IN_PROGRESS",
    selectedAgentId: ownedAgentA.id
  });
  const agentJobDone = buildJob({
    title: "Seed - QA Audit",
    createdBy: otherUser,
    status: "COMPLETED",
    selectedAgentId: ownedAgentA.id
  });

  const escrowSigned = buildEscrow({
    jobId: inProgressJob.id,
    payer: address,
    amount: decimal("350"),
    currency: "USD",
    status: "LOCKED"
  });
  const escrowCompleted = buildEscrow({
    jobId: completedJob.id,
    payer: address,
    amount: decimal("520"),
    currency: "USD",
    status: "RELEASED",
    releasedAt: new Date()
  });

  const billForOwnedAgent = buildBill({
    jobId: agentJobDone.id,
    agentId: ownedAgentA.id,
    amount: decimal("420"),
    status: "PAID",
    payeeAddress: ownedAgentA.owner,
    payerAddress: otherUser
  });

  const disputeInitiatedByMe = buildDispute({
    jobId: completedJob.id,
    escrowId: escrowCompleted.id,
    initiator: address,
    status: "VOTING",
    votesFor: 3,
    votesAgainst: 1,
    totalWeight: decimal("5"),
    reason: "Deliverable mismatch"
  });
  const disputeAgainstMyJob = buildDispute({
    jobId: inProgressJob.id,
    escrowId: escrowSigned.id,
    initiator: externalAgent.owner,
    status: "OPEN",
    votesFor: 0,
    votesAgainst: 0,
    totalWeight: decimal("0"),
    reason: "Timeline concern"
  });

  await prisma.$transaction([
    prisma.wallet.upsert({
      where: { address },
      update: {
        balance: decimal("1200"),
        lockedAmount: decimal("350"),
        totalEarnings: decimal("900"),
        totalSpent: decimal("780")
      },
      create: {
        address,
        balance: decimal("1200"),
        lockedAmount: decimal("350"),
        totalEarnings: decimal("900"),
        totalSpent: decimal("780")
      }
    }),
    prisma.agent.create({ data: ownedAgentA }),
    prisma.agent.create({ data: ownedAgentB }),
    prisma.agent.create({ data: externalAgent }),
    prisma.job.create({ data: openJob }),
    prisma.job.create({ data: inProgressJob }),
    prisma.job.create({ data: completedJob }),
    prisma.job.create({ data: matchingJob }),
    prisma.job.create({ data: agentJobActive }),
    prisma.job.create({ data: agentJobDone }),
    prisma.bid.create({
      data: {
        id: randomUUID(),
        jobId: openJob.id,
        agentId: externalAgent.id,
        bidPrice: decimal("220"),
        currency: "USD",
        message: "Can start immediately",
        status: "PENDING"
      }
    }),
    prisma.bid.create({
      data: {
        id: randomUUID(),
        jobId: openJob.id,
        agentId: ownedAgentA.id,
        bidPrice: decimal("210"),
        currency: "USD",
        message: "Premium QA coverage",
        status: "PENDING"
      }
    }),
    prisma.escrow.create({ data: escrowSigned }),
    prisma.escrow.create({ data: escrowCompleted }),
    prisma.bill.create({ data: billForOwnedAgent }),
    prisma.dispute.create({ data: disputeInitiatedByMe }),
    prisma.dispute.create({ data: disputeAgainstMyJob })
  ]);

  console.log("Seeded dashboard data for address:", address);
  console.log("Created jobs:", [openJob.id, inProgressJob.id, completedJob.id, matchingJob.id]);
  console.log("Created agents:", [ownedAgentA.id, ownedAgentB.id, externalAgent.id]);
  console.log("Created disputes:", [disputeInitiatedByMe.id, disputeAgainstMyJob.id]);

  await prisma.$disconnect();
};

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
