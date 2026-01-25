import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const RATE = 1_000_000n;
const SERVICE_FEE_BPS = 200n; // 2%
const RELEASE_DELAY = 15 * 60; // 15 minutes

describe("AgentHiring", () => {
	async function deployFixture() {
		const [owner, employer, agentOwner, keeper, user2] =
			await ethers.getSigners();

		// Deploy CBT
		const CBT = await ethers.getContractFactory("CBT");
		const cbt = await CBT.deploy(owner.address, RATE);

		// Deploy Treasury
		const Treasury = await ethers.getContractFactory("Treasury");
		const treasury = await Treasury.deploy(await cbt.getAddress());
		await cbt.connect(owner).setTreasury(await treasury.getAddress());

		// Deploy AgentHiring
		const AgentHiring = await ethers.getContractFactory("AgentHiring");
		const agentHiring = await AgentHiring.deploy(
			await cbt.getAddress(),
			await treasury.getAddress(),
			keeper.address,
			SERVICE_FEE_BPS,
			RELEASE_DELAY,
		);

		await treasury.setAuthorizedCaller(await agentHiring.getAddress(), true);

		return {
			owner,
			employer,
			agentOwner,
			keeper,
			user2,
			cbt,
			treasury,
			agentHiring,
		};
	}

	describe("Deployment", () => {
		it("should set correct initial values", async () => {
			const { agentHiring, cbt, treasury, keeper } = await deployFixture();

			expect(await agentHiring.cbt()).to.equal(await cbt.getAddress());
			expect(await agentHiring.treasury()).to.equal(
				await treasury.getAddress(),
			);
			expect(await agentHiring.keeper()).to.equal(keeper.address);
			expect(await agentHiring.serviceFeeBps()).to.equal(SERVICE_FEE_BPS);
			expect(await agentHiring.releaseDelay()).to.equal(RELEASE_DELAY);
		});
	});

	describe("Direct Purchase", () => {
		it("should create engagement for direct purchase", async () => {
			const { employer, agentOwner, cbt, agentHiring, treasury } =
				await deployFixture();

			// Buy CBT
			const ethIn = ethers.parseEther("1");
			await cbt.connect(employer).buyCBT({ value: ethIn });

			// Approve
			const price = 1000n * 10n ** 18n;
			const fee = (price * SERVICE_FEE_BPS) / 10_000n;
			const total = price + fee;
			await cbt
				.connect(employer)
				.approve(await agentHiring.getAddress(), total);

			// Hire agent
			const agentId = "cm5l8xo2y";
			const jobId = "";
			const purchaseType = 0; // DIRECT

			const tx = await agentHiring
				.connect(employer)
				.hire(agentId, agentOwner.address, jobId, price, purchaseType);

			await expect(tx)
				.to.emit(agentHiring, "EngagementCreated")
				.withArgs(
					1,
					employer.address,
					agentId,
					agentOwner.address,
					jobId,
					purchaseType,
					price,
				);

			// Check balances
			expect(await cbt.balanceOf(await agentHiring.getAddress())).to.equal(
				price,
			);
			expect(await cbt.balanceOf(await treasury.getAddress())).to.equal(fee);

			// Check engagement
			const engagement = await agentHiring.engagements(1);
			expect(engagement.id).to.equal(1);
			expect(engagement.user).to.equal(employer.address);
			expect(engagement.agentId).to.equal(agentId);
			expect(engagement.agentOwner).to.equal(agentOwner.address);
			expect(engagement.jobId).to.equal(jobId);
			expect(engagement.purchaseType).to.equal(purchaseType);
			expect(engagement.totalPaid).to.equal(price);
			expect(engagement.status).to.equal(0); // ACTIVE
		});

		it("should track engagements by user", async () => {
			const { employer, agentOwner, cbt, agentHiring } = await deployFixture();

			const ethIn = ethers.parseEther("1");
			await cbt.connect(employer).buyCBT({ value: ethIn });

			const price = 1000n * 10n ** 18n;
			const fee = (price * SERVICE_FEE_BPS) / 10_000n;
			await cbt
				.connect(employer)
				.approve(await agentHiring.getAddress(), (price + fee) * 2n);

			// Create two engagements
			await agentHiring
				.connect(employer)
				.hire("agent1", agentOwner.address, "", price, 0);
			await agentHiring
				.connect(employer)
				.hire("agent2", agentOwner.address, "", price, 0);

			const engagements = await agentHiring.getEngagementsByUser(
				employer.address,
			);
			expect(engagements.length).to.equal(2);
			expect(engagements[0]).to.equal(1);
			expect(engagements[1]).to.equal(2);
		});

		it("should track engagements by agentId", async () => {
			const { employer, agentOwner, user2, cbt, agentHiring } =
				await deployFixture();

			const ethIn = ethers.parseEther("2");
			await cbt.connect(employer).buyCBT({ value: ethIn });
			await cbt.connect(user2).buyCBT({ value: ethIn });

			const price = 1000n * 10n ** 18n;
			const fee = (price * SERVICE_FEE_BPS) / 10_000n;
			await cbt
				.connect(employer)
				.approve(await agentHiring.getAddress(), price + fee);
			await cbt
				.connect(user2)
				.approve(await agentHiring.getAddress(), price + fee);

			const agentId = "cm5l8xo2y";

			// Two users hire the same agent
			await agentHiring
				.connect(employer)
				.hire(agentId, agentOwner.address, "", price, 0);
			await agentHiring
				.connect(user2)
				.hire(agentId, agentOwner.address, "", price, 0);

			const engagements = await agentHiring.getEngagementsByAgentId(agentId);
			expect(engagements.length).to.equal(2);
		});

		it("should track engagements by owner", async () => {
			const { employer, agentOwner, cbt, agentHiring } = await deployFixture();

			const ethIn = ethers.parseEther("1");
			await cbt.connect(employer).buyCBT({ value: ethIn });

			const price = 1000n * 10n ** 18n;
			const fee = (price * SERVICE_FEE_BPS) / 10_000n;
			await cbt
				.connect(employer)
				.approve(await agentHiring.getAddress(), (price + fee) * 2n);

			// Same owner, different agents
			await agentHiring
				.connect(employer)
				.hire("agent1", agentOwner.address, "", price, 0);
			await agentHiring
				.connect(employer)
				.hire("agent2", agentOwner.address, "", price, 0);

			const engagements = await agentHiring.getEngagementsByOwner(
				agentOwner.address,
			);
			expect(engagements.length).to.equal(2);
		});
	});

	describe("Job-Based Purchase", () => {
		it("should create engagement for job-based purchase", async () => {
			const { employer, agentOwner, cbt, agentHiring } = await deployFixture();

			const ethIn = ethers.parseEther("1");
			await cbt.connect(employer).buyCBT({ value: ethIn });

			const price = 1000n * 10n ** 18n;
			const fee = (price * SERVICE_FEE_BPS) / 10_000n;
			await cbt
				.connect(employer)
				.approve(await agentHiring.getAddress(), price + fee);

			const agentId = "cm5l8xo2y";
			const jobId = "cm5l8xo2y000008l3cbm9abcd";
			const purchaseType = 1; // JOB_BASED

			const tx = await agentHiring
				.connect(employer)
				.hire(agentId, agentOwner.address, jobId, price, purchaseType);

			await expect(tx)
				.to.emit(agentHiring, "EngagementCreated")
				.withArgs(
					1,
					employer.address,
					agentId,
					agentOwner.address,
					jobId,
					purchaseType,
					price,
				);

			const engagement = await agentHiring.engagements(1);
			expect(engagement.jobId).to.equal(jobId);
			expect(engagement.purchaseType).to.equal(purchaseType);
		});
	});

	describe("Payment Release", () => {
		it("should allow user to approve completion", async () => {
			const { employer, agentOwner, cbt, agentHiring } = await deployFixture();

			const ethIn = ethers.parseEther("1");
			await cbt.connect(employer).buyCBT({ value: ethIn });

			const price = 1000n * 10n ** 18n;
			const fee = (price * SERVICE_FEE_BPS) / 10_000n;
			await cbt
				.connect(employer)
				.approve(await agentHiring.getAddress(), price + fee);

			await agentHiring
				.connect(employer)
				.hire("agent1", agentOwner.address, "", price, 0);

			// User approves
			const tx = await agentHiring.connect(employer).approveCompletion(1);

			await expect(tx)
				.to.emit(agentHiring, "PaymentReleased")
				.withArgs(1, agentOwner.address, price);

			// Check balances
			expect(await cbt.balanceOf(agentOwner.address)).to.equal(price);
			expect(await cbt.balanceOf(await agentHiring.getAddress())).to.equal(0);

			// Check status
			const engagement = await agentHiring.engagements(1);
			expect(engagement.status).to.equal(1); // COMPLETED
			expect(engagement.endTime).to.be.greaterThan(0);
		});

		it("should allow keeper to auto release after delay", async () => {
			const { employer, agentOwner, keeper, cbt, agentHiring } =
				await deployFixture();

			const ethIn = ethers.parseEther("1");
			await cbt.connect(employer).buyCBT({ value: ethIn });

			const price = 1000n * 10n ** 18n;
			const fee = (price * SERVICE_FEE_BPS) / 10_000n;
			await cbt
				.connect(employer)
				.approve(await agentHiring.getAddress(), price + fee);

			await agentHiring
				.connect(employer)
				.hire("agent1", agentOwner.address, "", price, 0);

			// Try to release too early
			await expect(
				agentHiring.connect(keeper).autoRelease(1),
			).to.be.revertedWithCustomError(agentHiring, "TooEarly");

			// Fast forward
			await time.increase(RELEASE_DELAY + 1);

			// Now it should work
			const tx = await agentHiring.connect(keeper).autoRelease(1);

			await expect(tx)
				.to.emit(agentHiring, "PaymentReleased")
				.withArgs(1, agentOwner.address, price);

			expect(await cbt.balanceOf(agentOwner.address)).to.equal(price);
		});

		it("should prevent non-keeper from auto releasing", async () => {
			const { employer, agentOwner, cbt, agentHiring } = await deployFixture();

			const ethIn = ethers.parseEther("1");
			await cbt.connect(employer).buyCBT({ value: ethIn });

			const price = 1000n * 10n ** 18n;
			const fee = (price * SERVICE_FEE_BPS) / 10_000n;
			await cbt
				.connect(employer)
				.approve(await agentHiring.getAddress(), price + fee);

			await agentHiring
				.connect(employer)
				.hire("agent1", agentOwner.address, "", price, 0);

			await time.increase(RELEASE_DELAY + 1);

			await expect(
				agentHiring.connect(employer).autoRelease(1),
			).to.be.revertedWithCustomError(agentHiring, "Unauthorized");
		});

		it("should prevent non-user from approving completion", async () => {
			const { employer, agentOwner, user2, cbt, agentHiring } =
				await deployFixture();

			const ethIn = ethers.parseEther("1");
			await cbt.connect(employer).buyCBT({ value: ethIn });

			const price = 1000n * 10n ** 18n;
			const fee = (price * SERVICE_FEE_BPS) / 10_000n;
			await cbt
				.connect(employer)
				.approve(await agentHiring.getAddress(), price + fee);

			await agentHiring
				.connect(employer)
				.hire("agent1", agentOwner.address, "", price, 0);

			await expect(
				agentHiring.connect(user2).approveCompletion(1),
			).to.be.revertedWithCustomError(agentHiring, "Unauthorized");
		});
	});

	describe("Refund", () => {
		it("should allow owner to refund", async () => {
			const { owner, employer, agentOwner, cbt, agentHiring } =
				await deployFixture();

			const ethIn = ethers.parseEther("1");
			await cbt.connect(employer).buyCBT({ value: ethIn });

			const price = 1000n * 10n ** 18n;
			const fee = (price * SERVICE_FEE_BPS) / 10_000n;
			await cbt
				.connect(employer)
				.approve(await agentHiring.getAddress(), price + fee);

			await agentHiring
				.connect(employer)
				.hire("agent1", agentOwner.address, "", price, 0);

			const balanceBefore = await cbt.balanceOf(employer.address);

			const tx = await agentHiring.connect(owner).refund(1);

			await expect(tx)
				.to.emit(agentHiring, "PaymentRefunded")
				.withArgs(1, employer.address, price);

			const balanceAfter = await cbt.balanceOf(employer.address);
			expect(balanceAfter - balanceBefore).to.equal(price);

			const engagement = await agentHiring.engagements(1);
			expect(engagement.status).to.equal(3); // CANCELLED
		});
	});

	describe("Configuration", () => {
		it("should allow owner to update service fee", async () => {
			const { owner, agentHiring } = await deployFixture();

			const newBps = 300n;
			const tx = await agentHiring.connect(owner).setServiceFeeBps(newBps);

			await expect(tx)
				.to.emit(agentHiring, "ServiceFeeUpdated")
				.withArgs(SERVICE_FEE_BPS, newBps);

			expect(await agentHiring.serviceFeeBps()).to.equal(newBps);
		});

		it("should prevent setting fee too high", async () => {
			const { owner, agentHiring } = await deployFixture();

			await expect(
				agentHiring.connect(owner).setServiceFeeBps(1001),
			).to.be.revertedWithCustomError(agentHiring, "FeeTooHigh");
		});

		it("should allow owner to update release delay", async () => {
			const { owner, agentHiring } = await deployFixture();

			const newDelay = 7 * 24 * 60 * 60; // 7 days
			const tx = await agentHiring.connect(owner).setReleaseDelay(newDelay);

			await expect(tx)
				.to.emit(agentHiring, "ReleaseDelayUpdated")
				.withArgs(RELEASE_DELAY, newDelay);

			expect(await agentHiring.releaseDelay()).to.equal(newDelay);
		});

		it("should allow owner to update keeper", async () => {
			const { owner, user2, agentHiring } = await deployFixture();

			const tx = await agentHiring.connect(owner).setKeeper(user2.address);

			await expect(tx).to.emit(agentHiring, "KeeperUpdated");

			expect(await agentHiring.keeper()).to.equal(user2.address);
		});
	});

	describe("Edge Cases", () => {
		it("should reject zero address for agent owner", async () => {
			const { employer, cbt, agentHiring } = await deployFixture();

			const ethIn = ethers.parseEther("1");
			await cbt.connect(employer).buyCBT({ value: ethIn });

			const price = 1000n * 10n ** 18n;
			const fee = (price * SERVICE_FEE_BPS) / 10_000n;
			await cbt
				.connect(employer)
				.approve(await agentHiring.getAddress(), price + fee);

			await expect(
				agentHiring
					.connect(employer)
					.hire("agent1", ethers.ZeroAddress, "", price, 0),
			).to.be.revertedWithCustomError(agentHiring, "ZeroAddress");
		});

		it("should reject zero price", async () => {
			const { employer, agentOwner, cbt, agentHiring } = await deployFixture();

			const ethIn = ethers.parseEther("1");
			await cbt.connect(employer).buyCBT({ value: ethIn });

			await expect(
				agentHiring
					.connect(employer)
					.hire("agent1", agentOwner.address, "", 0, 0),
			).to.be.revertedWithCustomError(agentHiring, "InvalidPrice");
		});

		it("should reject empty agent ID", async () => {
			const { employer, agentOwner, cbt, agentHiring } = await deployFixture();

			const ethIn = ethers.parseEther("1");
			await cbt.connect(employer).buyCBT({ value: ethIn });

			const price = 1000n * 10n ** 18n;
			const fee = (price * SERVICE_FEE_BPS) / 10_000n;
			await cbt
				.connect(employer)
				.approve(await agentHiring.getAddress(), price + fee);

			await expect(
				agentHiring
					.connect(employer)
					.hire("", agentOwner.address, "", price, 0),
			).to.be.revertedWithCustomError(agentHiring, "InvalidAgentId");
		});
	});
});
