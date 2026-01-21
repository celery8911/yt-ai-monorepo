import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const RATE = 1_000_000n;
const SERVICE_FEE_BPS = 1000n;
const RELEASE_DELAY = 15 * 60;
const VOTE_COST = 100n * 10n ** 18n;
const VOTING_PERIOD = 48 * 60 * 60;
const MIN_VOTERS = 3n;

describe("Dashboard contracts", function () {
  async function deployFixture() {
    const [owner, employer, agent, keeper, voter1, voter2, voter3] = await ethers.getSigners();

    const CBT = await ethers.getContractFactory("CBT");
    const cbt = await CBT.deploy(owner.address, RATE);

    const Treasury = await ethers.getContractFactory("Treasury");
    const treasury = await Treasury.deploy(await cbt.getAddress());
    await cbt.connect(owner).setTreasury(await treasury.getAddress());

    const Escrow = await ethers.getContractFactory("Escrow");
    const escrow = await Escrow.deploy(await cbt.getAddress(), await treasury.getAddress(), SERVICE_FEE_BPS, RELEASE_DELAY);

    const DisputeDAO = await ethers.getContractFactory("DisputeDAO");
    const dao = await DisputeDAO.deploy(
      await cbt.getAddress(),
      await escrow.getAddress(),
      await treasury.getAddress(),
      keeper.address,
      VOTE_COST,
      VOTING_PERIOD,
      MIN_VOTERS
    );

    await treasury.setEscrow(await escrow.getAddress());
    await treasury.setDao(await dao.getAddress());
    await escrow.setDao(await dao.getAddress());
    await escrow.setKeeper(keeper.address);

    return { owner, employer, agent, keeper, voter1, voter2, voter3, treasury, cbt, escrow, dao };
  }

  it("mints CBT from ETH and forwards to treasury", async function () {
    const { employer, treasury, cbt } = await deployFixture();
    const ethIn = ethers.parseEther("1");

    const tx = cbt.connect(employer).buyCBT({ value: ethIn });
    await expect(tx).to.changeTokenBalance(cbt, employer, ethIn * RATE);
    await expect(tx).to.changeEtherBalance(treasury, ethIn);
  });

  it("creates escrow and auto releases after delay", async function () {
    const { employer, agent, keeper, cbt, escrow, treasury } = await deployFixture();
    const ethIn = ethers.parseEther("1");
    await cbt.connect(employer).buyCBT({ value: ethIn });

    const price = 1000n * 10n ** 18n;
    const fee = (price * SERVICE_FEE_BPS) / 10_000n;

    await cbt.connect(employer).approve(await escrow.getAddress(), price + fee);
    await escrow.connect(employer).createEscrow(ethers.id("job-1"), agent.address, price);

    expect(await cbt.balanceOf(await escrow.getAddress())).to.equal(price);
    expect(await cbt.balanceOf(await treasury.getAddress())).to.equal(fee);

    await time.increase(RELEASE_DELAY + 1);
    await escrow.connect(keeper).autoRelease(ethers.id("job-1"));

    expect(await cbt.balanceOf(agent.address)).to.equal(price);
  });

  it("resolves dispute with default employer win and refunds", async function () {
    const { employer, agent, keeper, cbt, escrow, dao } = await deployFixture();
    const ethIn = ethers.parseEther("1");
    await cbt.connect(employer).buyCBT({ value: ethIn });

    const price = 1000n * 10n ** 18n;
    const fee = (price * SERVICE_FEE_BPS) / 10_000n;

    await cbt.connect(employer).approve(await escrow.getAddress(), price + fee);
    await escrow.connect(employer).createEscrow(ethers.id("job-2"), agent.address, price);

    await dao.connect(employer).openDispute(ethers.id("job-2"), 1);

    const balanceBefore = await cbt.balanceOf(employer.address);
    await time.increase(VOTING_PERIOD + 1);
    await dao.connect(keeper).resolveDispute(ethers.id("job-2"));

    const balanceAfter = await cbt.balanceOf(employer.address);
    expect(balanceAfter - balanceBefore).to.equal(price);
  });

  it("distributes rewards equally among winning voters", async function () {
    const { employer, agent, keeper, voter1, voter2, voter3, cbt, escrow, dao } = await deployFixture();
    const ethIn = ethers.parseEther("1");
    await cbt.connect(employer).buyCBT({ value: ethIn });

    const price = 1000n * 10n ** 18n;
    const fee = (price * SERVICE_FEE_BPS) / 10_000n;

    await cbt.connect(employer).approve(await escrow.getAddress(), price + fee);
    await escrow.connect(employer).createEscrow(ethers.id("job-3"), agent.address, price);

    await dao.connect(employer).openDispute(ethers.id("job-3"), 1);

    await cbt.connect(employer).transfer(voter1.address, VOTE_COST);
    await cbt.connect(employer).transfer(voter2.address, VOTE_COST);
    await cbt.connect(employer).transfer(voter3.address, VOTE_COST);

    await cbt.connect(voter1).approve(await dao.getAddress(), VOTE_COST);
    await cbt.connect(voter2).approve(await dao.getAddress(), VOTE_COST);
    await cbt.connect(voter3).approve(await dao.getAddress(), VOTE_COST);

    await dao.connect(voter1).vote(ethers.id("job-3"), false);
    await dao.connect(voter2).vote(ethers.id("job-3"), false);
    await dao.connect(voter3).vote(ethers.id("job-3"), false);

    await time.increase(VOTING_PERIOD + 1);
    await dao.connect(keeper).resolveDispute(ethers.id("job-3"));

    const rewardPerWinner = fee / 3n;

    await dao.connect(voter1).claimReward(ethers.id("job-3"));
    await dao.connect(voter2).claimReward(ethers.id("job-3"));
    await dao.connect(voter3).claimReward(ethers.id("job-3"));

    expect(await cbt.balanceOf(voter1.address)).to.equal(rewardPerWinner);
    expect(await cbt.balanceOf(voter2.address)).to.equal(rewardPerWinner);
    expect(await cbt.balanceOf(voter3.address)).to.equal(rewardPerWinner);
  });
});
