// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * FCAT – Fractal Creator Token
 *
 * - ERC20 token representing creator shares
 * - All initial supply goes to the creator
 * - Factory is the owner (so it can wire minter etc.)
 * - "minter" (the revenue contract) can mint more for buyers
 */
contract FCAT is ERC20, Ownable {
    string public assetURI;
    address public creator;
    address public minter;

    constructor(
        string memory name_,
        string memory symbol_,
        string memory assetURI_,
        address creator_,
        uint256 initialSupply_
    )
        ERC20(name_, symbol_)
        // 👇 Owner is whoever deployed this contract (the Factory)
        Ownable(msg.sender)
    {
        require(creator_ != address(0), "Zero creator");
        assetURI = assetURI_;
        creator = creator_;

        if (initialSupply_ > 0) {
            _mint(creator_, initialSupply_);
        }
    }

    /// Set the revenue contract that is allowed to mint more FCAT
    function setMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "Zero minter");
        minter = _minter;
    }

    /// Mint tokens to a buyer; only the revenue contract can call this
    function mintTo(address to, uint256 amount) external {
        require(msg.sender == minter, "Not minter");
        _mint(to, amount);
    }
}
