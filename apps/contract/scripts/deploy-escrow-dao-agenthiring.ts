import { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
	const [deployer] = await ethers.getSigners();
	const keeperEnv = process.env.KEEPER_ADDRESS || "";
	const keeper =
		keeperEnv && ethers.isAddress(keeperEnv) ? keeperEnv : deployer.address;

	const cbtAddress = process.env.CBT_ADDRESS;
	const treasuryAddress = process.env.TREASURY_ADDRESS;

	if (!cbtAddress || !ethers.isAddress(cbtAddress)) {
		throw new Error("Invalid or missing CBT_ADDRESS in environment");
	}

	if (!treasuryAddress || !ethers.isAddress(treasuryAddress)) {
		throw new Error("Invalid or missing TREASURY_ADDRESS in environment");
	}

	const serviceFeeBps = 1000n;
	const escrowServiceFeeBps = 0n;
	const releaseDelay = 15 * 60;
	const voteCost = 100n * 10n ** 18n;
	const votingPeriod = 48 * 60 * 60;
	const minVoters = 3n;

	console.log("Deploying Escrow/DisputeDAO/AgentHiring...");
	console.log("Deployer:", deployer.address);
	console.log("CBT Address:", cbtAddress);
	console.log("Treasury Address:", treasuryAddress);
	console.log("Keeper Address:", keeper);

	const Escrow = await ethers.getContractFactory("Escrow");
	const escrow = await Escrow.deploy(
		cbtAddress,
		treasuryAddress,
		escrowServiceFeeBps,
		releaseDelay,
	);
	await escrow.waitForDeployment();

	const DisputeDAO = await ethers.getContractFactory("DisputeDAO");
	const dao = await DisputeDAO.deploy(
		cbtAddress,
		await escrow.getAddress(),
		treasuryAddress,
		keeper,
		voteCost,
		votingPeriod,
		minVoters,
	);
	await dao.waitForDeployment();

	const Treasury = await ethers.getContractFactory("Treasury");
	const treasury = Treasury.attach(treasuryAddress);

	await (await treasury.setEscrow(await escrow.getAddress())).wait();
	await (await treasury.setDao(await dao.getAddress())).wait();
	await (await escrow.setDao(await dao.getAddress())).wait();
	await (await escrow.setKeeper(keeper)).wait();

	const AgentHiring = await ethers.getContractFactory("AgentHiring");
	const agentHiring = await AgentHiring.deploy(
		cbtAddress,
		treasuryAddress,
		await escrow.getAddress(),
		keeper,
		serviceFeeBps,
		releaseDelay,
	);
	await agentHiring.waitForDeployment();

	await (
		await treasury.setAuthorizedCaller(await agentHiring.getAddress(), true)
	).wait();

	console.log("\n=== Deployment Complete ===");
	console.log("Escrow:", await escrow.getAddress());
	console.log("DisputeDAO:", await dao.getAddress());
	console.log("AgentHiring:", await agentHiring.getAddress());

	console.log("\n=== Update These Addresses ===");
	console.log("1. packages/yt-libs/src/contracts/addresses.ts");
	console.log("2. apps/contract/subgraph/subgraph.yaml");
	console.log("3. apps/back-end/.env (ESCROW_ADDRESS, DAO_ADDRESS)");
	console.log(
		"4. apps/contract/.env (ESCROW_ADDRESS, DISPUTE_DAO_ADDRESS, AGENT_HIRING_ADDRESS)",
	);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
