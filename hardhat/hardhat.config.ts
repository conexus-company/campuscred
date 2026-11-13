import "dotenv/config";
import "@nomicfoundation/hardhat-toolbox";
import type { HardhatUserConfig } from "hardhat/config";

const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "paris",
    },
  },
  networks: {
    bscTestnet: {
      chainId: 97,
      url: process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
      accounts: deployerKey ? [deployerKey] : [],
    },
  },
  // One Etherscan v2 key covers BscScan (chain 97).
  etherscan: { apiKey: process.env.BSCSCAN_API_KEY ?? "" },
  sourcify: { enabled: false },
};

export default config;
