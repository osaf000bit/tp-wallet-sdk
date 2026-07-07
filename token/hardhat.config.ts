import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const accounts = PRIVATE_KEY ? [PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    bscTestnet: {
      url:
        process.env.BSC_TESTNET_RPC ??
        'https://data-seed-prebsc-1-s1.bnbchain.org:8545',
      chainId: 97,
      accounts
    },
    bsc: {
      url: process.env.BSC_RPC ?? 'https://bsc-dataseed.bnbchain.org',
      chainId: 56,
      accounts
    }
  }
};

export default config;
