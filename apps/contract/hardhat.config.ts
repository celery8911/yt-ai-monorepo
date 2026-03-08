import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
import type { HardhatUserConfig } from "hardhat/config";

dotenv.config();

const sepoliaUrl = process.env.SEPOLIA_RPC_URL || "";
const arbitrumSepoliaUrl = process.env.ARBITRUM_SEPOLIA_RPC_URL || "";
const baseSepoliaUrl = process.env.BASE_SEPOLIA_RPC_URL || "";
const opSepoliaUrl = process.env.OP_SEPOLIA_RPC_URL || "";
const zkSyncSepoliaUrl =
	process.env.ZKSYNC_SEPOLIA_RPC_URL || "https://sepolia.era.zksync.dev";
const polygonAmoyUrl =
	process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology";
const bscTestnetUrl =
	process.env.BSC_TESTNET_RPC_URL ||
	"https://data-seed-prebsc-1-s1.binance.org:8545";
const deployerKey = process.env.DEPLOYER_PRIVATE_KEY || "";
const etherscanApiKey = process.env.ETHERSCAN_API_KEY || "";
const hasValidKey =
	deployerKey.length === 66 ||
	(deployerKey.length === 64 && !deployerKey.startsWith("0x"));
const accounts = hasValidKey ? [deployerKey] : [];

const config: HardhatUserConfig = {
	solidity: {
		version: "0.8.24",
		settings: {
			optimizer: {
				enabled: true,
				runs: 200,
			},
		},
	},
	networks: {
		sepolia: {
			url: sepoliaUrl,
			accounts,
		},
		arbitrumSepolia: {
			url: arbitrumSepoliaUrl,
			accounts,
			chainId: 421614,
		},
		baseSepolia: {
			url: baseSepoliaUrl,
			accounts,
			chainId: 84532,
		},
		optimismSepolia: {
			url: opSepoliaUrl,
			accounts,
			chainId: 11155420,
		},
		zkSyncSepolia: {
			url: zkSyncSepoliaUrl,
			accounts,
			chainId: 300,
		},
		polygonAmoy: {
			url: polygonAmoyUrl,
			accounts,
			chainId: 80002,
		},
		bscTestnet: {
			url: bscTestnetUrl,
			accounts,
			chainId: 97,
		},
	},
	etherscan: {
		apiKey: etherscanApiKey,
	},
	paths: {
		sources: "./contracts",
		tests: "./test",
		cache: "./cache",
		artifacts: "./artifacts",
	},
};

export default config;
