import { expect } from 'chai';
import { ethers } from 'hardhat';
import { ShosToken } from '../typechain-types';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

const DECIMALS = 18n;
const ONE = 10n ** DECIMALS;
const INITIAL_SUPPLY = 1_000_000n * ONE;
const CAP = 10_000_000n * ONE;

describe('ShosToken', () => {
  let token: ShosToken;
  let owner: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory('ShosToken');
    token = (await Factory.deploy(
      owner.address,
      INITIAL_SUPPLY,
      CAP
    )) as unknown as ShosToken;
    await token.waitForDeployment();
  });

  describe('metadata & deployment', () => {
    it('exposes BEP-20 metadata', async () => {
      expect(await token.name()).to.equal('SHOS Token');
      expect(await token.symbol()).to.equal('SHOS');
      expect(await token.decimals()).to.equal(18);
    });

    it('mints the initial supply to the owner', async () => {
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY);
      expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
    });

    it('sets the cap and the owner', async () => {
      expect(await token.cap()).to.equal(CAP);
      expect(await token.owner()).to.equal(owner.address);
    });

    it('supports deploying with zero initial supply', async () => {
      const Factory = await ethers.getContractFactory('ShosToken');
      const fresh = await Factory.deploy(alice.address, 0n, CAP);
      await fresh.waitForDeployment();
      expect(await fresh.totalSupply()).to.equal(0n);
      expect(await fresh.owner()).to.equal(alice.address);
    });
  });

  describe('transfers', () => {
    it('transfers tokens between accounts', async () => {
      await expect(token.transfer(alice.address, 100n * ONE)).to.changeTokenBalances(
        token,
        [owner, alice],
        [-(100n * ONE), 100n * ONE]
      );
    });

    it('reverts when transferring more than the balance', async () => {
      await expect(
        token.connect(alice).transfer(bob.address, 1n)
      ).to.be.revertedWithCustomError(token, 'ERC20InsufficientBalance');
    });

    it('supports approve + transferFrom', async () => {
      await token.approve(alice.address, 50n * ONE);
      expect(await token.allowance(owner.address, alice.address)).to.equal(
        50n * ONE
      );
      await token
        .connect(alice)
        .transferFrom(owner.address, bob.address, 50n * ONE);
      expect(await token.balanceOf(bob.address)).to.equal(50n * ONE);
    });
  });

  describe('minting', () => {
    it('lets the owner mint within the cap', async () => {
      await token.mint(alice.address, 500n * ONE);
      expect(await token.balanceOf(alice.address)).to.equal(500n * ONE);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY + 500n * ONE);
    });

    it('rejects minting from a non-owner', async () => {
      await expect(
        token.connect(alice).mint(alice.address, 1n)
      ).to.be.revertedWithCustomError(token, 'OwnableUnauthorizedAccount');
    });

    it('rejects minting beyond the cap', async () => {
      const remaining = CAP - INITIAL_SUPPLY;
      await expect(
        token.mint(owner.address, remaining + 1n)
      ).to.be.revertedWithCustomError(token, 'ERC20ExceededCap');
    });

    it('allows minting exactly up to the cap', async () => {
      const remaining = CAP - INITIAL_SUPPLY;
      await token.mint(owner.address, remaining);
      expect(await token.totalSupply()).to.equal(CAP);
    });
  });

  describe('burning', () => {
    it('lets a holder burn their own tokens', async () => {
      await token.burn(100n * ONE);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY - 100n * ONE);
    });

    it('burns via allowance with burnFrom', async () => {
      await token.approve(alice.address, 100n * ONE);
      await token.connect(alice).burnFrom(owner.address, 100n * ONE);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY - 100n * ONE);
      expect(await token.allowance(owner.address, alice.address)).to.equal(0n);
    });

    it('reverts burnFrom without sufficient allowance', async () => {
      await expect(
        token.connect(alice).burnFrom(owner.address, 1n)
      ).to.be.revertedWithCustomError(token, 'ERC20InsufficientAllowance');
    });

    it('frees cap room so re-minting after a burn is allowed', async () => {
      await token.mint(owner.address, CAP - INITIAL_SUPPLY); // reach the cap
      await token.burn(1n * ONE);
      await expect(token.mint(owner.address, 1n * ONE)).to.not.be.reverted;
      expect(await token.totalSupply()).to.equal(CAP);
    });
  });

  describe('ownership', () => {
    it('transfers ownership', async () => {
      await token.transferOwnership(alice.address);
      expect(await token.owner()).to.equal(alice.address);
      await token.connect(alice).mint(bob.address, 1n * ONE);
      expect(await token.balanceOf(bob.address)).to.equal(1n * ONE);
    });

    it('renounces ownership, disabling minting', async () => {
      await token.renounceOwnership();
      expect(await token.owner()).to.equal(ethers.ZeroAddress);
      await expect(
        token.mint(owner.address, 1n)
      ).to.be.revertedWithCustomError(token, 'OwnableUnauthorizedAccount');
    });
  });
});
