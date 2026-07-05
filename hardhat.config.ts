import { existsSync } from "fs";
import { loadEnvFile } from "process";

if (existsSync(".env")) {
  loadEnvFile();
}

import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatEthersChaiMatchers from "@nomicfoundation/hardhat-ethers-chai-matchers";
import hardhatMocha from "@nomicfoundation/hardhat-mocha";
import hardhatNetworkHelpers from "@nomicfoundation/hardhat-network-helpers";
import hardhatTypechain from "@nomicfoundation/hardhat-typechain";
import hardhatVerify from "@nomicfoundation/hardhat-verify";
import type { HardhatUserConfig } from "hardhat/config";

const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL;
const arcTestnetRpcUrl = process.env.ARC_TESTNET_RPC_URL;
const deployerKey = process.env.DEPLOYER_KEY;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      evmVersion: "prague",
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainId: 31337,
      initialBaseFeePerGas: 0
    },
    localhost: {
      type: "http",
      url: process.env.LOCAL_RPC_URL ?? "http://127.0.0.1:8545",
      chainId: 31337
    },
    ...(sepoliaRpcUrl
      ? {
          sepolia: {
            type: "http" as const,
            url: sepoliaRpcUrl,
            chainId: 11155111,
            accounts: deployerKey ? [deployerKey] : []
          }
        }
      : {}),
    ...(arcTestnetRpcUrl
      ? {
          arcTestnet: {
            type: "http" as const,
            url: arcTestnetRpcUrl,
            chainId: 5042002,
            accounts: deployerKey ? [deployerKey] : []
          }
        }
      : {})
  },
  plugins: [
    hardhatEthers,
    hardhatTypechain,
    hardhatMocha,
    hardhatEthersChaiMatchers,
    hardhatNetworkHelpers,
    hardhatVerify
  ]
};

export default config;
