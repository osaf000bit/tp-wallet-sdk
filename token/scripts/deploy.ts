import { ethers } from 'hardhat';

/**
 * Deploy ShosToken. Configure via env vars:
 *   SHOS_INITIAL_SUPPLY  initial supply in whole tokens (default 1,000,000)
 *   SHOS_CAP             hard cap in whole tokens (default 10,000,000)
 *   SHOS_OWNER           owner address (default: first signer)
 */
async function main(): Promise<void> {
  const decimals = 18n;
  const unit = 10n ** decimals;

  const [deployer] = await ethers.getSigners();
  const owner = process.env.SHOS_OWNER ?? deployer.address;
  const initialSupply =
    BigInt(process.env.SHOS_INITIAL_SUPPLY ?? '1000000') * unit;
  const cap = BigInt(process.env.SHOS_CAP ?? '10000000') * unit;

  const Factory = await ethers.getContractFactory('ShosToken');
  const token = await Factory.deploy(owner, initialSupply, cap);
  await token.waitForDeployment();

  console.log(`ShosToken deployed to: ${await token.getAddress()}`);
  console.log(`  owner:         ${owner}`);
  console.log(`  initialSupply: ${initialSupply}`);
  console.log(`  cap:           ${cap}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
