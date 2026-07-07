import { HardhatUserConfig } from 'hardhat/config';
import { HttpNetworkAccountsUserConfig } from 'hardhat/types';
import '@nomicfoundation/hardhat-toolbox';

// Accept either a hex private key or a BIP-39 mnemonic in PRIVATE_KEY.
function resolveAccounts(): HttpNetworkAccountsUserConfig {
  const raw = process.env.PRIVATE_KEY?.trim();
  if (!raw) return [];
  if (raw.includes(' ')) return { mnemonic: raw };
  return [raw.startsWith('0x') ? raw : `0x${raw}`];
}

const accounts = resolveAccounts();

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
