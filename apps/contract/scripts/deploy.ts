import { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  const keeperEnv = process.env.KEEPER_ADDRESS || "";
  const keeper = keeperEnv && ethers.isAddress(keeperEnv) ? keeperEnv : deployer.address;

  const rate = 1_000_000n;
  const serviceFeeBps = 1000n;
  const releaseDelay = 15 * 60;
  const voteCost = 100n * 10n ** 18n;
  const votingPeriod = 48 * 60 * 60;
  const minVoters = 3n;

  const CBT = await ethers.getContractFactory("CBT");
  const cbt = await CBT.deploy(deployer.address, rate);
  await cbt.waitForDeployment();

  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(await cbt.getAddress());
  await treasury.waitForDeployment();

  await (await cbt.setTreasury(await treasury.getAddress())).wait();

  const Escrow = await ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(
    await cbt.getAddress(),
    await treasury.getAddress(),
    serviceFeeBps,
    releaseDelay
  );
  await escrow.waitForDeployment();

  const DisputeDAO = await ethers.getContractFactory("DisputeDAO");
  const dao = await DisputeDAO.deploy(
    await cbt.getAddress(),
    await escrow.getAddress(),
    await treasury.getAddress(),
    keeper,
    voteCost,
    votingPeriod,
    minVoters
  );
  await dao.waitForDeployment();

  await (await treasury.setEscrow(await escrow.getAddress())).wait();
  await (await treasury.setDao(await dao.getAddress())).wait();
  await (await escrow.setDao(await dao.getAddress())).wait();
  await (await escrow.setKeeper(keeper)).wait();

  console.log("CBT:", await cbt.getAddress());
  console.log("Treasury:", await treasury.getAddress());
  console.log("Escrow:", await escrow.getAddress());
  console.log("DisputeDAO:", await dao.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
