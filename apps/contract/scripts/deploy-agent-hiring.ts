import { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
	const [deployer] = await ethers.getSigners();
	const keeperEnv = process.env.KEEPER_ADDRESS || "";
	const keeper =
		keeperEnv && ethers.isAddress(keeperEnv) ? keeperEnv : deployer.address;

	// 获取已部署的合约地址
	const cbtAddress = process.env.CBT_ADDRESS;
	const treasuryAddress = process.env.TREASURY_ADDRESS;
	const escrowAddress = process.env.ESCROW_ADDRESS;

	if (!cbtAddress || !ethers.isAddress(cbtAddress)) {
		throw new Error("Invalid or missing CBT_ADDRESS in environment");
	}

	if (!treasuryAddress || !ethers.isAddress(treasuryAddress)) {
		throw new Error("Invalid or missing TREASURY_ADDRESS in environment");
	}

	if (!escrowAddress || !ethers.isAddress(escrowAddress)) {
		throw new Error("Invalid or missing ESCROW_ADDRESS in environment");
	}

	// 配置参数
	const serviceFeeBps = 1000n; // 10% service fee (1000 / 10000)
	const releaseDelay = 7 * 24 * 60 * 60; // 7 days in seconds

	console.log("Deploying AgentHiring contract...");
	console.log("Deployer:", deployer.address);
	console.log("CBT Address:", cbtAddress);
	console.log("Treasury Address:", treasuryAddress);
	console.log("Escrow Address:", escrowAddress);
	console.log("Keeper Address:", keeper);
	console.log("Service Fee:", `${Number(serviceFeeBps) / 100}%`);
	console.log("Release Delay:", `${releaseDelay / (24 * 60 * 60)} days`);

	// 部署 AgentHiring 合约
	const AgentHiring = await ethers.getContractFactory("AgentHiring");
	const agentHiring = await AgentHiring.deploy(
		cbtAddress,
		treasuryAddress,
		escrowAddress,
		keeper,
		serviceFeeBps,
		releaseDelay,
	);

	await agentHiring.waitForDeployment();

	const agentHiringAddress = await agentHiring.getAddress();

	console.log("\n=== Deployment Successful ===");
	console.log("AgentHiring:", agentHiringAddress);

	console.log("\nAuthorizing AgentHiring in Treasury...");
	const Treasury = await ethers.getContractFactory("Treasury");
	const treasury = Treasury.attach(treasuryAddress);
	await (await treasury.setAuthorizedCaller(agentHiringAddress, true)).wait();
	console.log("Authorized caller set:", agentHiringAddress);

	// 设置 Keeper (如果不是 deployer)
	if (keeper !== deployer.address) {
		console.log("\nSetting keeper...");
		await (await agentHiring.setKeeper(keeper)).wait();
		console.log("Keeper set to:", keeper);
	}

	console.log("\n=== Next Steps ===");
	console.log(
		`1. Update .env with: AGENT_HIRING_ADDRESS=${agentHiringAddress}`,
	);
	console.log(
		"2. Update packages/yt-libs/src/contracts/addresses.ts with the new address",
	);
	console.log(
		"3. Update apps/contract/subgraph/subgraph.yaml with the address",
	);
	console.log("4. Deploy the updated subgraph to The Graph");
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
