import { ethers } from 'hardhat';

async function main(): Promise<void> {
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 97n) {
    throw new Error('Refusing deployment: OskiStaking is configured for BSC testnet only (chainId 97).');
  }

  const tokenAddress = process.env.OSKI_TOKEN_ADDRESS;
  if (!tokenAddress || !ethers.isAddress(tokenAddress)) {
    throw new Error('Set OSKI_TOKEN_ADDRESS to the OSKI BEP-20 contract address.');
  }

  const [deployer] = await ethers.getSigners();
  const owner = process.env.STAKING_OWNER ?? deployer.address;
  if (!ethers.isAddress(owner)) throw new Error('STAKING_OWNER must be a valid address.');

  // Human-readable OSKI tokens emitted per second; converted to 18-decimal base units.
  const rewardRate = ethers.parseEther(process.env.OSKI_REWARD_RATE ?? '0.1');
  const Factory = await ethers.getContractFactory('OskiStaking');
  const staking = await Factory.deploy(tokenAddress, owner, rewardRate);
  await staking.waitForDeployment();

  console.log('OskiStaking deployed:', await staking.getAddress());
  console.log('OSKI token:', tokenAddress);
  console.log('Owner:', owner);
  console.log('Reward rate (OSKI/second):', process.env.OSKI_REWARD_RATE ?? '0.1');
  console.log('Fund rewards separately by approving the staking contract and calling fundRewards(amount).');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
