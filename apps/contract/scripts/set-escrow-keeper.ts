import { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
	const [deployer] = await ethers.getSigners();
	const keeper = process.env.KEEPER_ADDRESS || "";
	const escrowAddr = process.env.ESCROW_ADDRESS || "";

	if (!ethers.isAddress(keeper)) {
		throw new Error("KEEPER_ADDRESS is missing or invalid");
	}
	if (!ethers.isAddress(escrowAddr)) {
		throw new Error("ESCROW_ADDRESS is missing or invalid");
	}

	const Escrow = await ethers.getContractFactory("Escrow");
	const escrow = Escrow.attach(escrowAddr);

	console.log("Using deployer:", deployer.address);
	console.log("Setting escrow keeper:", keeper);

	await (await escrow.setKeeper(keeper)).wait();
	console.log("Escrow keeper updated");
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
