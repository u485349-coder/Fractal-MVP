// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IFCAT {
    function mintTo(address to, uint256 amount) external;
    function balanceOf(address) external view returns (uint256);
    function totalSupply() external view returns (uint256);
}

contract CreatorRevenueShare {
    IFCAT public token;
    address public creator;

    uint256 public pricePerTokenWei;

    // Total revenue deposited for sharing (NOT token sales)
    uint256 public totalRevenue;

    // % of revenue that goes to creator
    uint256 public constant CREATOR_PERCENT = 70;

    // Tracks how much each holder has already claimed
    mapping(address => uint256) public claimed;

    // Extra stats for dashboards / analytics
    uint256 public totalTokensSold;
    uint256 public totalSalesETH;

    // Track how much of the creator's share has already been withdrawn
    uint256 public creatorClaimed;

    event Purchased(address indexed buyer, uint256 amount, uint256 paid);
    event RevenueDeposited(uint256 amount);
    event RevenueClaimed(address indexed claimer, uint256 amount);
    event CreatorWithdrawn(uint256 amount);

    /**
     * ✅ FIXED CONSTRUCTOR
     * Factory passes the real creator explicitly
     */
    constructor(
        address token_,
        address creator_,
        uint256 priceWei_
    ) {
        require(token_ != address(0), "Zero token");
        require(creator_ != address(0), "Zero creator");
        require(priceWei_ > 0, "Zero price");

        token = IFCAT(token_);
        creator = creator_;
        pricePerTokenWei = priceWei_;
    }

    // -------------------------
    // TOKEN PURCHASE LOGIC
    // -------------------------

    function buy(uint256 amount) external payable {
        uint256 required = amount * pricePerTokenWei;
        require(msg.value >= required, "Insufficient ETH");

        if (msg.value > required) {
            payable(msg.sender).transfer(msg.value - required);
        }

        token.mintTo(msg.sender, amount);

        totalTokensSold += amount;
        totalSalesETH += required;

        emit Purchased(msg.sender, amount, required);
    }

    function buyOne() external payable {
        require(msg.value == pricePerTokenWei, "Wrong ETH");

        token.mintTo(msg.sender, 1);

        totalTokensSold += 1;
        totalSalesETH += msg.value;

        emit Purchased(msg.sender, 1, msg.value);
    }

    // -------------------------
    // REVENUE SYSTEM
    // -------------------------

    function depositRevenue() external payable {
        require(msg.value > 0, "No ETH sent");
        totalRevenue += msg.value;

        emit RevenueDeposited(msg.value);
    }

    function holderPool() public view returns (uint256) {
        return (totalRevenue * (100 - CREATOR_PERCENT)) / 100;
    }

    function creatorShareInfo()
        external
        view
        returns (uint256 grossShare, uint256 claimedShare, uint256 remaining)
    {
        grossShare = (totalRevenue * CREATOR_PERCENT) / 100;
        claimedShare = creatorClaimed;
        remaining = grossShare > claimedShare
            ? grossShare - claimedShare
            : 0;
    }

    function claimable(address user) public view returns (uint256) {
        uint256 bal = token.balanceOf(user);
        uint256 supply = token.totalSupply();

        if (bal == 0 || supply == 0) return 0;

        uint256 pool = holderPool();
        uint256 entitled = (pool * bal) / supply;

        if (entitled <= claimed[user]) return 0;
        return entitled - claimed[user];
    }

    function claimRevenue() external {
        uint256 payout = claimable(msg.sender);
        require(payout > 0, "Nothing to claim");

        claimed[msg.sender] += payout;
        payable(msg.sender).transfer(payout);

        emit RevenueClaimed(msg.sender, payout);
    }

    function creatorWithdraw() external {
        require(msg.sender == creator, "Not creator");

        uint256 grossShare =
            (totalRevenue * CREATOR_PERCENT) / 100;

        require(grossShare > creatorClaimed, "Nothing to withdraw");

        uint256 payout = grossShare - creatorClaimed;
        creatorClaimed = grossShare;

        payable(creator).transfer(payout);

        emit CreatorWithdrawn(payout);
    }

    receive() external payable {
        totalRevenue += msg.value;
        emit RevenueDeposited(msg.value);
    }
}
