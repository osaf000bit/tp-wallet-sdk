import { expect } from 'chai';
import { ethers } from 'hardhat';
import { time } from '@nomicfoundation/hardhat-network-helpers';

const ONE = ethers.parseEther('1');
const INITIAL_SUPPLY = ethers.parseEther('1000000');
const CAP = ethers.parseEther('10000000');

describe('OskiStaking', () => {
  async function deployFixture() {
    const [owner, alice, bob] = await ethers.getSigners();
    const Token = await ethers.getContractFactory('ShosToken');
    const token = await Token.deploy(owner.address, INITIAL_SUPPLY, CAP);
    await token.waitForDeployment();

    const Staking = await ethers.getContractFactory('OskiStaking');
    const staking = await Staking.deploy(await token.getAddress(), owner.address, ONE);
    await staking.waitForDeployment();

    await token.transfer(alice.address, ethers.parseEther('500'));
    await token.transfer(bob.address, ethers.parseEther('500'));
    await token.approve(await staking.getAddress(), ethers.parseEther('1000'));

    return { owner, alice, bob, token, staking };
  }

  it('accepts stake and returns principal on unstake', async () => {
    const { alice, token, staking } = await deployFixture();
    const amount = ethers.parseEther('100');
    await token.connect(alice).approve(await staking.getAddress(), amount);
    await staking.connect(alice).stake(amount);

    expect(await staking.totalStaked()).to.equal(amount);
    expect(await staking.balanceOf(alice.address)).to.equal(amount);

    await staking.connect(alice).unstake(amount);
    expect(await staking.totalStaked()).to.equal(0n);
    expect(await token.balanceOf(alice.address)).to.equal(ethers.parseEther('500'));
  });

  it('never pays principal as rewards when the reward reserve is empty', async () => {
    const { alice, token, staking } = await deployFixture();
    const principal = ethers.parseEther('100');
    await token.connect(alice).approve(await staking.getAddress(), principal);
    await staking.connect(alice).stake(principal);
    await time.increase(10);

    await expect(staking.connect(alice).claim()).to.be.revertedWith('Staking: nothing to claim');
    expect(await staking.totalStaked()).to.equal(principal);
    expect(await token.balanceOf(await staking.getAddress())).to.equal(principal);
  });

  it('accrues and pays rewards only from the funded reward reserve', async () => {
    const { alice, token, staking } = await deployFixture();
    const principal = ethers.parseEther('100');
    const rewardFunding = ethers.parseEther('50');

    await token.connect(alice).approve(await staking.getAddress(), principal);
    await staking.connect(alice).stake(principal);
    await staking.fundRewards(rewardFunding);
    await time.increase(10);

    expect(await staking.pendingRewards(alice.address)).to.equal(ethers.parseEther('10'));
    await staking.connect(alice).claim();

    const remainingReserve = await staking.rewardReserve();
    expect(await token.balanceOf(alice.address)).to.be.greaterThan(ethers.parseEther('400'));
    expect(await token.balanceOf(alice.address)).to.be.lessThan(ethers.parseEther('450'));
    expect(await staking.totalStaked()).to.equal(principal);
    expect(remainingReserve).to.be.greaterThanOrEqual(ethers.parseEther('39'));
    expect(remainingReserve).to.be.lessThanOrEqual(ethers.parseEther('40'));
    expect(await staking.totalRewardsAccrued()).to.equal(0n);
    expect(await token.balanceOf(await staking.getAddress())).to.equal(
      principal + remainingReserve
    );
  });

  it('distributes rewards pro rata between stakers', async () => {
    const { alice, bob, token, staking } = await deployFixture();
    const aliceStake = ethers.parseEther('100');
    const bobStake = ethers.parseEther('300');

    await token.connect(alice).approve(await staking.getAddress(), aliceStake);
    await token.connect(bob).approve(await staking.getAddress(), bobStake);
    await staking.connect(alice).stake(aliceStake);
    await staking.connect(bob).stake(bobStake);
    await staking.fundRewards(ethers.parseEther('100'));
    await time.increase(8);

    expect(await staking.pendingRewards(alice.address)).to.equal(ethers.parseEther('2'));
    expect(await staking.pendingRewards(bob.address)).to.equal(ethers.parseEther('6'));
  });

  it('caps emissions at the available reward reserve', async () => {
    const { alice, token, staking } = await deployFixture();
    const principal = ethers.parseEther('100');
    await token.connect(alice).approve(await staking.getAddress(), principal);
    await staking.connect(alice).stake(principal);
    await staking.fundRewards(ethers.parseEther('5'));
    await time.increase(20);

    expect(await staking.pendingRewards(alice.address)).to.equal(ethers.parseEther('5'));
    await staking.connect(alice).claim();
    expect(await staking.rewardReserve()).to.equal(0n);
    expect(await staking.totalStaked()).to.equal(principal);
  });

  it('does not accrue rewards while no one is staking', async () => {
    const { alice, token, staking } = await deployFixture();
    await staking.fundRewards(ethers.parseEther('50'));
    await time.increase(100);
    const amount = ethers.parseEther('100');
    await token.connect(alice).approve(await staking.getAddress(), amount);
    await staking.connect(alice).stake(amount);
    await time.increase(2);

    expect(await staking.pendingRewards(alice.address)).to.equal(ethers.parseEther('2'));
  });

  it('updates the old rate before changing it and restricts rate changes to owner', async () => {
    const { alice, token, staking } = await deployFixture();
    const amount = ethers.parseEther('100');
    await token.connect(alice).approve(await staking.getAddress(), amount);
    await staking.connect(alice).stake(amount);
    await staking.fundRewards(ethers.parseEther('100'));
    await time.increase(5);

    await expect(staking.connect(alice).setRate(ethers.parseEther('2')))
      .to.be.revertedWithCustomError(staking, 'OwnableUnauthorizedAccount');
    await staking.setRate(ethers.parseEther('2'));
    await time.increase(3);

    expect(await staking.rewardRate()).to.equal(ethers.parseEther('2'));
    expect(await staking.pendingRewards(alice.address)).to.be.greaterThan(ethers.parseEther('10'));
  });

  it('rejects zero stake, zero unstake, and over-unstaking', async () => {
    const { alice, staking } = await deployFixture();
    await expect(staking.connect(alice).stake(0)).to.be.revertedWith('Staking: zero amount');
    await expect(staking.connect(alice).unstake(0)).to.be.revertedWith('Staking: zero amount');
    await expect(staking.connect(alice).unstake(1)).to.be.revertedWith('Staking: insufficient stake');
  });
});
