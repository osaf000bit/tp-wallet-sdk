// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Capped} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SHOS
 * @notice BEP-20 token for BNB Smart Chain.
 *
 * Standard 18-decimal token with an optional hard cap, owner-restricted
 * minting and holder-initiated burning. BEP-20 is interface-compatible with
 * ERC-20, so the OpenZeppelin ERC20 base applies directly on BSC.
 */
contract ShosToken is ERC20, ERC20Burnable, ERC20Capped, Ownable {
    /// @param initialOwner Address that receives ownership and the initial supply.
    /// @param initialSupply Tokens minted to `initialOwner` at deployment (in wei units).
    /// @param cap_ Maximum total supply that can ever exist (in wei units); must be >= initialSupply.
    constructor(
        address initialOwner,
        uint256 initialSupply,
        uint256 cap_
    ) ERC20("SHOS Token", "SHOS") ERC20Capped(cap_) Ownable(initialOwner) {
        if (initialSupply > 0) {
            _mint(initialOwner, initialSupply);
        }
    }

    /**
     * @notice Mint new tokens to `to`. Restricted to the owner and bounded by the cap.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @dev Resolve the multiple-inheritance `_update` between ERC20 and ERC20Capped.
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Capped) {
        super._update(from, to, value);
    }
}
