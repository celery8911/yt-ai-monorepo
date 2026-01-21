import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
import type { HardhatUserConfig } from "hardhat/config";

dotenv.config();

const sepoliaUrl = process.env.SEPOLIA_RPC_URL || "";
const deployerKey = process.env.DEPLOYER_PRIVATE_KEY || "";
const hasValidKey =
  deployerKey.length === 66 || (deployerKey.length === 64 && !deployerKey.startsWith("0x"));
const accounts = hasValidKey ? [deployerKey] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    sepolia: {
      url: sepoliaUrl,
      accounts
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

export default config;
