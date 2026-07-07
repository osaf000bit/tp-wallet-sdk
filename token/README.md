# SHOS Token (BEP-20)

`SHOS` is a BEP-20 token for BNB Smart Chain, built on OpenZeppelin. BEP-20 is
interface-compatible with ERC-20, so the standard ERC-20 base applies on BSC.

## Features

- 18 decimals, name `SHOS Token`, symbol `SHOS`.
- Configurable initial supply and a hard `cap` (max total supply).
- Owner-restricted `mint` (`Ownable`).
- Holder `burn` / `burnFrom` (`ERC20Burnable`); burning frees cap room.

## Usage

```bash
npm install
npm run compile
npm test
npm run coverage
```

## Deploy

Set a deployer key and (optionally) an RPC endpoint, then run the script:

```bash
export PRIVATE_KEY=0x...            # deployer private key
export SHOS_INITIAL_SUPPLY=1000000  # whole tokens
export SHOS_CAP=10000000            # whole tokens

npx hardhat run scripts/deploy.ts --network bscTestnet
# mainnet: --network bsc
```

Network RPCs can be overridden with `BSC_TESTNET_RPC` / `BSC_RPC`.
