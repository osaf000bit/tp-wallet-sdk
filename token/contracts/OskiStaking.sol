// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title OskiStaking
 * @notice Single-token staking with separately funded rewards.
 * @dev Staked principal, unallocated rewards, and accrued reward liabilities
 *      are accounted for separately. Claims can never spend staked principal.
 *      The reward rate is denominated in token base units per second.
 */
contract OskiStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 private constant PRECISION = 1e18;

    IERC20 public immutable stakingToken;
    uint256 public rewardRate;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    uint256 public totalStaked;
    uint256 public rewardReserve;
    uint256 public totalRewardsAccrued;

    mapping(address => uint256) public balanceOf;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    event Staked(address indexed account, uint256 amount);
    event Unstaked(address indexed account, uint256 amount);
    event RewardPaid(address indexed account, uint256 amount);
    event RewardsFunded(address indexed funder, uint256 amount);
    event RewardRateUpdated(uint256 previousRate, uint256 newRate);

    modifier updateReward(address account) {
        _updateGlobalReward();
        if (account != address(0)) {
            rewards[account] = _earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    constructor(
        IERC20 stakingToken_,
        address initialOwner,
        uint256 initialRewardRate
    ) Ownable(initialOwner) {
        require(address(stakingToken_) != address(0), "Staking: zero token");
        stakingToken = stakingToken_;
        rewardRate = initialRewardRate;
        lastUpdateTime = block.timestamp;
    }

    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Staking: zero amount");

        uint256 balanceBefore = stakingToken.balanceOf(address(this));
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = stakingToken.balanceOf(address(this)) - balanceBefore;
        require(received == amount, "Staking: fee-on-transfer unsupported");

        balanceOf[msg.sender] += amount;
        totalStaked += amount;
        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Staking: zero amount");
        require(balanceOf[msg.sender] >= amount, "Staking: insufficient stake");

        balanceOf[msg.sender] -= amount;
        totalStaked -= amount;
        stakingToken.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    function claim() external nonReentrant updateReward(msg.sender) {
        uint256 amount = rewards[msg.sender];
        require(amount > 0, "Staking: nothing to claim");

        rewards[msg.sender] = 0;
        totalRewardsAccrued -= amount;
        stakingToken.safeTransfer(msg.sender, amount);
        emit RewardPaid(msg.sender, amount);
    }

    /**
     * @notice Anyone may add reward tokens; funded rewards are kept separate
     *         from staked principal and cannot be withdrawn as principal.
     */
    function fundRewards(uint256 amount) external nonReentrant updateReward(address(0)) {
        require(amount > 0, "Staking: zero funding");

        uint256 balanceBefore = stakingToken.balanceOf(address(this));
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = stakingToken.balanceOf(address(this)) - balanceBefore;
        require(received == amount, "Staking: fee-on-transfer unsupported");

        rewardReserve += amount;
        emit RewardsFunded(msg.sender, amount);
    }

    function setRate(uint256 newRate) external onlyOwner updateReward(address(0)) {
        uint256 previousRate = rewardRate;
        rewardRate = newRate;
        emit RewardRateUpdated(previousRate, newRate);
    }

    function pendingRewards(address account) external view returns (uint256) {
        uint256 currentRewardPerToken = rewardPerToken();
        return
            (balanceOf[account] *
                (currentRewardPerToken - userRewardPerTokenPaid[account])) /
            PRECISION +
            rewards[account];
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0 || block.timestamp <= lastUpdateTime) {
            return rewardPerTokenStored;
        }

        uint256 emitted = (block.timestamp - lastUpdateTime) * rewardRate;
        if (emitted > rewardReserve) emitted = rewardReserve;

        return rewardPerTokenStored + (emitted * PRECISION) / totalStaked;
    }

    function _updateGlobalReward() internal {
        if (block.timestamp > lastUpdateTime) {
            if (totalStaked > 0 && rewardReserve > 0 && rewardRate > 0) {
                uint256 emitted = (block.timestamp - lastUpdateTime) * rewardRate;
                if (emitted > rewardReserve) emitted = rewardReserve;

                rewardReserve -= emitted;
                totalRewardsAccrued += emitted;
                rewardPerTokenStored += (emitted * PRECISION) / totalStaked;
            }
            lastUpdateTime = block.timestamp;
        }
    }

    function _earned(address account) internal view returns (uint256) {
        return
            (balanceOf[account] *
                (rewardPerTokenStored - userRewardPerTokenPaid[account])) /
            PRECISION +
            rewards[account];
    }
}
