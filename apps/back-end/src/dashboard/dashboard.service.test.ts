import assert from "node:assert/strict";
import { test } from "node:test";
import { AgentsService } from "../agents/agents.service";
import { ChainStatusService } from "../chain-status/chain-status.service";
import { JobsService } from "../jobs/jobs.service";
import { PrismaService } from "../prisma/prisma.service";
import { WalletService } from "../wallet/wallet.service";
import { DashboardService } from "./dashboard.service";

const createServices = (chainStatusService?: ChainStatusService) => {
	process.env.DATABASE_URL = "";
	const prisma = new PrismaService();
	const jobsService = new JobsService(prisma);
	const agentsService = new AgentsService(prisma);
	const walletService = new WalletService(prisma);
	const resolvedChainStatus =
		chainStatusService ??
		({
			getEngagementsByUser: async () => ({ engagements: [] }),
		} as ChainStatusService);
	const dashboardService = new DashboardService(
		jobsService,
		agentsService,
		resolvedChainStatus,
		walletService,
		prisma,
	);
	return {
		jobsService,
		agentsService,
		walletService,
		dashboardService,
		prisma,
	};
};

test("getStats returns computed counts from in-memory data", async () => {
	const { jobsService, agentsService, walletService, prisma } =
		createServices();
	const agent = await agentsService.create({
		name: "Alpha",
		description: "Test agent",
		category: "QA",
		tags: ["qa"],
		endpointUrl: "https://example.com",
		supportedPaymentMethods: ["PER_TASK"],
		skillLevel: "BEGINNER",
		deliverableFormats: ["REPORT"],
		pricePerTask: 100,
		resultBasedMinPrice: 50,
		minBid: 10,
		currency: "USD",
		avgResponseTimeMs: 1000,
		successRate: 0.9,
		rating: 4.5,
		owner: "wallet_1",
		visibility: "public",
		isActive: true,
	});

	const job1 = await jobsService.create({
		title: "Job One",
		description: "Test",
		category: "QA",
		tags: ["qa"],
		paymentMethod: "PER_TASK",
		budgetMin: 100,
		budgetMax: 200,
		currency: "USD",
		requiredSkillLevel: "BEGINNER",
		deliverables: "Report",
		acceptanceCriteria: "Criteria",
		deadlineAt: new Date().toISOString(),
		priority: "LOW",
		autoMatchEnabled: false,
		biddingEnabled: true,
		escrowEnabled: true,
		visibility: "public",
		reviewWindowDays: 7,
		payoutStrategy: "WINNER_TAKE_ALL",
		createdBy: "wallet_1",
	});

	const job2 = await jobsService.create({
		title: "Job Two",
		description: "Test",
		category: "QA",
		tags: ["qa"],
		paymentMethod: "PER_TASK",
		budgetMin: 150,
		budgetMax: 250,
		currency: "USD",
		requiredSkillLevel: "BEGINNER",
		deliverables: "Report",
		acceptanceCriteria: "Criteria",
		deadlineAt: new Date().toISOString(),
		priority: "LOW",
		autoMatchEnabled: false,
		biddingEnabled: true,
		escrowEnabled: true,
		visibility: "public",
		reviewWindowDays: 7,
		payoutStrategy: "WINNER_TAKE_ALL",
		createdBy: "wallet_1",
	});

	await jobsService.selectAgent(job1.id, agent.id);
	await jobsService.updateStatus(job2.id, "COMPLETED");

	const chainStatusService = {
		getEngagementsByUser: async () => ({
			engagements: [
				{
					id: "1",
					engagementId: "1",
					user: "wallet_3",
					agentId: agent.id,
					agentOwner: "wallet_1",
					jobId: "",
					purchaseType: "DIRECT",
					totalPaid: "1000000000000000000",
					startTime: "1700000000",
					endTime: null,
					status: "ACTIVE",
				},
			],
		}),
	} as ChainStatusService;
	const dashboardService = new DashboardService(
		jobsService,
		agentsService,
		chainStatusService,
		walletService,
		prisma,
	);
	const stats = await dashboardService.getStats("wallet_1");

	assert.equal(stats.publishedJobsCount, 2);
	assert.equal(stats.activeJobsCount, 1);
	assert.equal(stats.completedJobsCount, 1);
	assert.equal(stats.publishedAgentsCount, 1);
	assert.equal(stats.signedAgentsCount, 1);
});

test("getPublishedJobs returns paginated results", async () => {
	const { jobsService, dashboardService } = createServices();
	await jobsService.create({
		title: "Job One",
		description: "Test",
		category: "QA",
		tags: ["qa"],
		paymentMethod: "PER_TASK",
		budgetMin: 100,
		budgetMax: 200,
		currency: "USD",
		requiredSkillLevel: "BEGINNER",
		deliverables: "Report",
		acceptanceCriteria: "Criteria",
		deadlineAt: new Date().toISOString(),
		priority: "LOW",
		autoMatchEnabled: false,
		biddingEnabled: true,
		escrowEnabled: true,
		visibility: "public",
		reviewWindowDays: 7,
		payoutStrategy: "WINNER_TAKE_ALL",
		createdBy: "wallet_2",
	});
	await jobsService.create({
		title: "Job Two",
		description: "Test",
		category: "QA",
		tags: ["qa"],
		paymentMethod: "PER_TASK",
		budgetMin: 150,
		budgetMax: 250,
		currency: "USD",
		requiredSkillLevel: "BEGINNER",
		deliverables: "Report",
		acceptanceCriteria: "Criteria",
		deadlineAt: new Date().toISOString(),
		priority: "LOW",
		autoMatchEnabled: false,
		biddingEnabled: true,
		escrowEnabled: true,
		visibility: "public",
		reviewWindowDays: 7,
		payoutStrategy: "WINNER_TAKE_ALL",
		createdBy: "wallet_2",
	});

	const response = await dashboardService.getPublishedJobs("wallet_2", 1, 1);

	assert.equal(response.data.length, 1);
	assert.equal(response.pagination.total, 2);
});
