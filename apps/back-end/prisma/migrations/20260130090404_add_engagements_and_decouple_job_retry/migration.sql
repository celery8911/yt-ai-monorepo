-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "tags" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "budgetMin" DECIMAL(65,30),
    "budgetMax" DECIMAL(65,30),
    "currency" TEXT,
    "deadlineAt" TIMESTAMP(3),
    "priority" TEXT NOT NULL,
    "requiredSkillLevel" TEXT NOT NULL,
    "deliverables" TEXT,
    "acceptanceCriteria" TEXT,
    "autoMatchEnabled" BOOLEAN NOT NULL,
    "biddingEnabled" BOOLEAN NOT NULL,
    "escrowEnabled" BOOLEAN NOT NULL,
    "visibility" TEXT NOT NULL,
    "reviewWindowDays" INTEGER NOT NULL DEFAULT 7,
    "reviewEndsAt" TIMESTAMP(3),
    "selectedAgentId" TEXT,
    "payoutStrategy" TEXT NOT NULL,
    "escrowId" TEXT,
    "disputeId" TEXT,
    "matchError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "tags" JSONB NOT NULL,
    "endpointUrl" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "visibility" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "supportedPaymentMethods" JSONB NOT NULL,
    "pricePerTask" DECIMAL(65,30),
    "resultBasedMinPrice" DECIMAL(65,30),
    "minBid" DECIMAL(65,30),
    "currency" TEXT,
    "skillLevel" TEXT NOT NULL,
    "deliverableFormats" JSONB NOT NULL,
    "requiresHumanReviewSupported" BOOLEAN NOT NULL DEFAULT false,
    "avgResponseTimeMs" INTEGER,
    "successRate" DOUBLE PRECISION,
    "rating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Engagement" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT,
    "escrowId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "jobId" TEXT,
    "agentOwner" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),

    CONSTRAINT "Engagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "matchScore" DOUBLE PRECISION,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "bidPrice" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Escrow" (
    "id" TEXT NOT NULL,
    "escrowId" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "jobId" TEXT,
    "payer" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "releaseTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "Escrow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "jobId" TEXT,
    "agentId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "escrowId" TEXT,
    "payeeAddress" TEXT NOT NULL,
    "payerAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "jobId" TEXT,
    "escrowId" TEXT NOT NULL,
    "initiator" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL,
    "votesFor" INTEGER NOT NULL DEFAULT 0,
    "votesAgainst" INTEGER NOT NULL DEFAULT 0,
    "totalWeight" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "resolvedOutcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "voter" TEXT NOT NULL,
    "vote" TEXT NOT NULL,
    "weight" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "address" TEXT NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "lockedAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalEarnings" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalSpent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("address")
);

-- CreateIndex
CREATE UNIQUE INDEX "Engagement_engagementId_key" ON "Engagement"("engagementId");

-- CreateIndex
CREATE UNIQUE INDEX "Engagement_escrowId_key" ON "Engagement"("escrowId");

-- CreateIndex
CREATE UNIQUE INDEX "Escrow_escrowId_key" ON "Escrow"("escrowId");

-- CreateIndex
CREATE UNIQUE INDEX "Escrow_engagementId_key" ON "Escrow"("engagementId");

-- AddForeignKey
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Escrow" ADD CONSTRAINT "Escrow_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
