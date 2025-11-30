import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    baseTestnet: {
      url: "https://base-sepolia.drpc.org", // ✅ Use HTTPS not WSS
      chainId: 84532, // ✅ Correct Base Sepolia chain ID
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000,
      gasMultiplier: 1.2
    },
    baseMainnet: {
      url: "https://mainnet.base.org",
      chainId: 8453,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    }
  },
  etherscan: {
    apiKey: {
      baseTestnet: "PLACEHOLDER_STRING",
      baseMainnet: "PLACEHOLDER_STRING"
    },
    customChains: [
      {
        network: "baseTestnet",
        chainId: 84532, // ✅ Update here too
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      },
      {
        network: "baseMainnet",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org"
        }
      }
    ]
  }
};

export default config;
