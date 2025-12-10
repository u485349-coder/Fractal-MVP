// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract CreatorRegistry is Ownable {

    struct Project {
        address creator;
        address fcat;
        address revenue;
        string name;
        string symbol;
        string assetURI;
        uint256 createdAt;
    }

    Project[] private _projects;

    mapping(address => uint256[]) private _creatorToProjectIds;
    mapping(address => uint256) public fcatToProjectIdPlus1;
    mapping(address => uint256) public revenueToProjectIdPlus1;

    address public factory;

    event FactoryUpdated(address indexed newFactory);
    event ProjectRegistered(
        uint256 indexed projectId,
        address indexed creator,
        address indexed fcat,
        address revenue
    );

    // ✅ FIX: pass initial owner to Ownable
    constructor(address initialOwner) Ownable(initialOwner) {}

    modifier onlyFactory() {
        require(msg.sender == factory, "Not factory");
        _;
    }

    function setFactory(address _factory) external onlyOwner {
        require(_factory != address(0), "Zero factory");
        factory = _factory;
        emit FactoryUpdated(_factory);
    }

    function projectCount() external view returns (uint256) {
        return _projects.length;
    }

    function registerProject(
        address creator,
        address fcat,
        address revenue,
        string memory name,
        string memory symbol,
        string memory assetURI
    ) external onlyFactory returns (uint256 projectId) {
        require(creator != address(0), "Zero creator");
        require(fcat != address(0), "Zero FCAT");
        require(revenue != address(0), "Zero revenue");
        require(fcatToProjectIdPlus1[fcat] == 0, "FCAT exists");
        require(revenueToProjectIdPlus1[revenue] == 0, "Revenue exists");

        projectId = _projects.length;

        _projects.push(
            Project({
                creator: creator,
                fcat: fcat,
                revenue: revenue,
                name: name,
                symbol: symbol,
                assetURI: assetURI,
                createdAt: block.timestamp
            })
        );

        _creatorToProjectIds[creator].push(projectId);
        fcatToProjectIdPlus1[fcat] = projectId + 1;
        revenueToProjectIdPlus1[revenue] = projectId + 1;

        emit ProjectRegistered(projectId, creator, fcat, revenue);
    }

    function getProject(uint256 projectId)
        external
        view
        returns (
            address creator,
            address fcat,
            address revenue,
            string memory name,
            string memory symbol,
            string memory assetURI,
            uint256 createdAt
        )
    {
        require(projectId < _projects.length, "Invalid project");
        Project storage p = _projects[projectId];
        return (
            p.creator,
            p.fcat,
            p.revenue,
            p.name,
            p.symbol,
            p.assetURI,
            p.createdAt
        );
    }

    function getCreatorProjects(address creator)
        external
        view
        returns (uint256[] memory)
    {
        return _creatorToProjectIds[creator];
    }
}
