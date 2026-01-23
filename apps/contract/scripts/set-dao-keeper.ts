import { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
	const [deployer] = await ethers.getSigners();
	const keeper = process.env.KEEPER_ADDRESS || "";
	const daoAddr = process.env.DAO_ADDRESS || "";

	if (!ethers.isAddress(keeper)) {
		throw new Error("KEEPER_ADDRESS is missing or invalid");
	}
	if (!ethers.isAddress(daoAddr)) {
		throw new Error("DAO_ADDRESS is missing or invalid");
	}

	const DisputeDAO = await ethers.getContractFactory("DisputeDAO");
	const dao = DisputeDAO.attach(daoAddr);

	console.log("Using deployer:", deployer.address);
	console.log("Setting DAO keeper:", keeper);

	await (await dao.setKeeper(keeper)).wait();
	console.log("DAO keeper updated");
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
