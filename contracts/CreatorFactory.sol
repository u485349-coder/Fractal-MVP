// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./FCAT.sol";
import "./CreatorRevenueShare.sol";
import "./CreatorRegistry.sol";

contract CreatorFactory is Ownable {
    CreatorRegistry public registry;

    event ProjectLaunched(
        uint256 indexed projectId,
        address indexed creator,
        address fcat,
        address revenue
    );

    /**
     * @param registryAddress Deployed CreatorRegistry
     * @param initialOwner    EOA that owns this Factory (you)
     */
    constructor(address registryAddress, address initialOwner)
        Ownable(initialOwner)
    {
        require(registryAddress != address(0), "Zero registry");
        registry = CreatorRegistry(registryAddress);
    }

    /**
     * Launch a new Fractal project.
     *
     * Flow:
     * 1. Deploy FCAT (owner = this Factory, creator gets initial supply)
     * 2. Deploy CreatorRevenueShare
     * 3. Set revenue as FCAT minter
     * 4. Register in CreatorRegistry
     */
    function launchProject(
        string memory name,
        string memory symbol,
        string memory assetURI,
        uint256 initialSupply,
        uint256 pricePerTokenWei
    ) external returns (uint256 projectId) {
        require(bytes(name).length != 0, "Name empty");
        require(bytes(symbol).length != 0, "Symbol empty");
        require(pricePerTokenWei > 0, "Price zero");

        address creator = msg.sender;

        // 1️⃣ Deploy FCAT
        FCAT fcat = new FCAT(
            name,
            symbol,
            assetURI,
            creator,
            initialSupply
        );

        // 2️⃣ Deploy Revenue contract
        // NOTE: see tweak to CreatorRevenueShare constructor in section 3.
        CreatorRevenueShare revenue = new CreatorRevenueShare(
            address(fcat),
            creator,
            pricePerTokenWei
        );

        // 3️⃣ Factory (as FCAT owner) wires minter
        fcat.setMinter(address(revenue));

        // 4️⃣ Register project in the registry
        projectId = registry.registerProject(
            creator,
            address(fcat),
            address(revenue),
            name,
            symbol,
            assetURI
        );

        emit ProjectLaunched(
            projectId,
            creator,
            address(fcat),
            address(revenue)
        );
    }
}
