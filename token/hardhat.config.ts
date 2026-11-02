import { HardhatUserConfig } from 'hardhat/config';
import { HttpNetworkAccountsUserConfig } from 'hardhat/types';
import '@nomicfoundation/hardhat-toolbox';

// Accept either a valid-length BIP-39 mnemonic or a 32-byte hex private key.
// Never log or otherwise expose the secret.
function resolveAccounts(): HttpNetworkAccountsUserConfig {
  const raw = process.env.PRIVATE_KEY;
  if (!raw?.trim()) return [];

  const words = raw.trim().split(/\s+/);
  if ([12, 15, 18, 21, 24].includes(words.length)) {
    return { mnemonic: words.join(' ') };
  }

  const privateKey = raw.trim().startsWith('0x')
    ? raw.trim()
    : `0x${raw.trim()}`;

  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error('PRIVATE_KEY is neither a valid mnemonic nor a 32-byte hex key');
  }

  return [privateKey];
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
