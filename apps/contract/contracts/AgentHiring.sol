// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ITreasury {
    function recordServiceFee(bytes32 jobId, uint256 amount) external;
}

error ZeroAddress();
error InvalidPrice();
error InvalidAgentId();
error InvalidStatus();
error Unauthorized();
error TooEarly();
error FeeTooHigh();

contract AgentHiring is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum EngagementStatus {
        ACTIVE,
        COMPLETED,
        DISPUTED,
        CANCELLED
    }

    enum PurchaseType {
        DIRECT,
        JOB_BASED
    }

    struct Engagement {
        uint256 id;
        address user;
        string agentId;
        address agentOwner;
        string jobId;
        PurchaseType purchaseType;
        uint256 totalPaid;
        uint256 startTime;
        uint256 endTime;
        EngagementStatus status;
    }

    IERC20 public immutable cbt;
    ITreasury public treasury;
    address public keeper;
    uint256 public serviceFeeBps;
    uint256 public releaseDelay;

    uint256 private nextEngagementId = 1;

    mapping(uint256 => Engagement) public engagements;
    mapping(address => uint256[]) public engagementsByUser;
    mapping(string => uint256[]) public engagementsByAgentId;
    mapping(address => uint256[]) public engagementsByOwner;

    event EngagementCreated(
        uint256 indexed engagementId,
        address indexed user,
        string agentId,
        address indexed agentOwner,
        string jobId,
        uint8 purchaseType,
        uint256 amount
    );

    event PaymentReleased(
        uint256 indexed engagementId,
        address indexed agentOwner,
        uint256 amount
    );

    event PaymentRefunded(
        uint256 indexed engagementId,
        address indexed user,
        uint256 amount
    );

    event ServiceFeeUpdated(uint256 oldBps, uint256 newBps);
    event ReleaseDelayUpdated(uint256 oldDelay, uint256 newDelay);
    event KeeperUpdated(address indexed oldKeeper, address indexed newKeeper);

    constructor(
        address cbt_,
        address treasury_,
        address keeper_,
        uint256 serviceFeeBps_,
        uint256 releaseDelay_
    ) Ownable(msg.sender) {
        if (cbt_ == address(0) || treasury_ == address(0)) {
            revert ZeroAddress();
        }
        cbt = IERC20(cbt_);
        treasury = ITreasury(treasury_);
        keeper = keeper_;
        serviceFeeBps = serviceFeeBps_;
        releaseDelay = releaseDelay_;
    }

    function hire(
        string memory agentId,
        address agentOwner,
        string memory jobId,
        uint256 price,
        PurchaseType purchaseType
    ) external nonReentrant returns (uint256) {
        if (agentOwner == address(0)) {
            revert ZeroAddress();
        }
        if (price == 0) {
            revert InvalidPrice();
        }
        if (bytes(agentId).length == 0) {
            revert InvalidAgentId();
        }

        uint256 engagementId = nextEngagementId++;
        uint256 fee = (price * serviceFeeBps) / 10_000;
        uint256 total = price + fee;

        cbt.safeTransferFrom(msg.sender, address(this), price);
        if (fee > 0) {
            cbt.safeTransferFrom(msg.sender, address(treasury), fee);
            bytes32 escrowId = keccak256(abi.encodePacked(engagementId));
            treasury.recordServiceFee(escrowId, fee);
        }

        engagements[engagementId] = Engagement({
            id: engagementId,
            user: msg.sender,
            agentId: agentId,
            agentOwner: agentOwner,
            jobId: jobId,
            purchaseType: purchaseType,
            totalPaid: price,
            startTime: block.timestamp,
            endTime: 0,
            status: EngagementStatus.ACTIVE
        });

        engagementsByUser[msg.sender].push(engagementId);
        engagementsByAgentId[agentId].push(engagementId);
        engagementsByOwner[agentOwner].push(engagementId);

        emit EngagementCreated(
            engagementId,
            msg.sender,
            agentId,
            agentOwner,
            jobId,
            uint8(purchaseType),
            price
        );

        return engagementId;
    }

    function approveCompletion(uint256 engagementId) external nonReentrant {
        Engagement storage engagement = engagements[engagementId];
        if (msg.sender != engagement.user) {
            revert Unauthorized();
        }
        if (engagement.status != EngagementStatus.ACTIVE) {
            revert InvalidStatus();
        }

        _releasePayment(engagement);
    }

    function autoRelease(uint256 engagementId) external {
        if (msg.sender != keeper) {
            revert Unauthorized();
        }
        Engagement storage engagement = engagements[engagementId];
        if (engagement.status != EngagementStatus.ACTIVE) {
            revert InvalidStatus();
        }
        if (block.timestamp < engagement.startTime + releaseDelay) {
            revert TooEarly();
        }

        _releasePayment(engagement);
    }

    function refund(uint256 engagementId) external onlyOwner nonReentrant {
        Engagement storage engagement = engagements[engagementId];
        if (
            engagement.status != EngagementStatus.ACTIVE &&
            engagement.status != EngagementStatus.DISPUTED
        ) {
            revert InvalidStatus();
        }

        engagement.status = EngagementStatus.CANCELLED;
        engagement.endTime = block.timestamp;

        cbt.safeTransfer(engagement.user, engagement.totalPaid);

        emit PaymentRefunded(engagementId, engagement.user, engagement.totalPaid);
    }

    function _releasePayment(Engagement storage engagement) private {
        engagement.status = EngagementStatus.COMPLETED;
        engagement.endTime = block.timestamp;

        cbt.safeTransfer(engagement.agentOwner, engagement.totalPaid);

        emit PaymentReleased(engagement.id, engagement.agentOwner, engagement.totalPaid);
    }

    function getEngagementsByUser(address user) external view returns (uint256[] memory) {
        return engagementsByUser[user];
    }

    function getEngagementsByAgentId(string memory agentId) external view returns (uint256[] memory) {
        return engagementsByAgentId[agentId];
    }

    function getEngagementsByOwner(address owner) external view returns (uint256[] memory) {
        return engagementsByOwner[owner];
    }

    function setServiceFeeBps(uint256 newBps) external onlyOwner {
        if (newBps > 1000) {
            revert FeeTooHigh();
        }
        uint256 oldBps = serviceFeeBps;
        serviceFeeBps = newBps;
        emit ServiceFeeUpdated(oldBps, newBps);
    }

    function setReleaseDelay(uint256 newDelay) external onlyOwner {
        uint256 oldDelay = releaseDelay;
        releaseDelay = newDelay;
        emit ReleaseDelayUpdated(oldDelay, newDelay);
    }

    function setKeeper(address newKeeper) external onlyOwner {
        if (newKeeper == address(0)) {
            revert ZeroAddress();
        }
        address oldKeeper = keeper;
        keeper = newKeeper;
        emit KeeperUpdated(oldKeeper, newKeeper);
    }
}
