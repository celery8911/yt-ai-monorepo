import { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
	const [deployer] = await ethers.getSigners();
	const keeper = process.env.KEEPER_ADDRESS || "";
	if (!ethers.isAddress(keeper)) {
		throw new Error("KEEPER_ADDRESS is missing or invalid");
	}

	const escrowAddr = process.env.ESCROW_ADDRESS || "";
	const daoAddr = process.env.DAO_ADDRESS || "";
	if (!ethers.isAddress(escrowAddr) || !ethers.isAddress(daoAddr)) {
		throw new Error("ESCROW_ADDRESS or DAO_ADDRESS is missing or invalid");
	}

	const Escrow = await ethers.getContractFactory("Escrow");
	const escrow = Escrow.attach(escrowAddr);
	const DisputeDAO = await ethers.getContractFactory("DisputeDAO");
	const dao = DisputeDAO.attach(daoAddr);

	console.log("Using deployer:", deployer.address);
	console.log("Setting keeper:", keeper);

	await (await escrow.setKeeper(keeper)).wait();
	await (await dao.setKeeper(keeper)).wait();

	console.log("Keeper updated on Escrow and DisputeDAO");
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
