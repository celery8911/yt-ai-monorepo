// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IEscrow {
    enum Status {
        NONE,
        LOCKED,
        RELEASED,
        FROZEN,
        REFUNDED
    }

    function payerOf(bytes32 jobId) external view returns (address);
    function agentOf(bytes32 jobId) external view returns (address);
    function serviceFeeOf(bytes32 jobId) external view returns (uint256);
    function statusOf(bytes32 jobId) external view returns (Status);
    function freeze(bytes32 jobId) external;
    function releaseToAgent(bytes32 jobId) external;
    function refundToPayer(bytes32 jobId) external;
}

interface ITreasury {
    function releaseReward(bytes32 jobId, uint256 amount, address to) external;
}

error ZeroAddress();
error Unauthorized();
error InvalidStatus();
error AlreadyVoted();
error VotingClosed();
error VotingOpen();
error NotWinner();
error NoReward();

contract DisputeDAO is Ownable {
    using SafeERC20 for IERC20;

    enum Status {
        NONE,
        OPEN,
        RESOLVED
    }

    struct Dispute {
        address initiator;
        uint40 openedAt;
        uint32 votesFor;
        uint32 votesAgainst;
        Status status;
        bool employerWins;
        uint256 rewardPerWinner;
    }

    IERC20 public immutable cbt;
    IEscrow public escrow;
    ITreasury public treasury;
    address public keeper;

    uint256 public voteCost;
    uint256 public votingPeriod;
    uint256 public minVoters;

    mapping(bytes32 => Dispute) private disputes;
    mapping(bytes32 => mapping(address => bool)) private hasVoted;
    mapping(bytes32 => mapping(address => bool)) private voteSide;
    mapping(bytes32 => mapping(address => bool)) private hasClaimed;

    event DisputeOpened(bytes32 indexed jobId, address indexed initiator, uint8 reason);
    event VoteCast(bytes32 indexed jobId, address indexed voter, bool support, uint256 cost);
    event DisputeResolved(bytes32 indexed jobId, bool employerWins);
    event RewardDistributed(bytes32 indexed jobId, address indexed winner, uint256 amount);
    event KeeperUpdated(address indexed oldKeeper, address indexed newKeeper);
    event VotingConfigUpdated(uint256 voteCost, uint256 votingPeriod, uint256 minVoters);

    constructor(
        address cbt_,
        address escrow_,
        address treasury_,
        address keeper_,
        uint256 voteCost_,
        uint256 votingPeriod_,
        uint256 minVoters_
    ) Ownable(msg.sender) {
        if (cbt_ == address(0) || escrow_ == address(0) || treasury_ == address(0) || keeper_ == address(0)) {
            revert ZeroAddress();
        }
        cbt = IERC20(cbt_);
        escrow = IEscrow(escrow_);
        treasury = ITreasury(treasury_);
        keeper = keeper_;
        voteCost = voteCost_;
        votingPeriod = votingPeriod_;
        minVoters = minVoters_;
    }

    function setKeeper(address keeper_) external onlyOwner {
        if (keeper_ == address(0)) {
            revert ZeroAddress();
        }
        address oldKeeper = keeper;
        keeper = keeper_;
        emit KeeperUpdated(oldKeeper, keeper_);
    }

    function setVotingConfig(uint256 voteCost_, uint256 votingPeriod_, uint256 minVoters_) external onlyOwner {
        voteCost = voteCost_;
        votingPeriod = votingPeriod_;
        minVoters = minVoters_;
        emit VotingConfigUpdated(voteCost_, votingPeriod_, minVoters_);
    }

    function openDispute(bytes32 jobId, uint8 reason) external {
        if (disputes[jobId].status != Status.NONE) {
            revert InvalidStatus();
        }
        if (escrow.statusOf(jobId) != IEscrow.Status.LOCKED) {
            revert InvalidStatus();
        }
        address payer = escrow.payerOf(jobId);
        if (payer != msg.sender) {
            revert Unauthorized();
        }

        disputes[jobId] = Dispute({
            initiator: msg.sender,
            openedAt: uint40(block.timestamp),
            votesFor: 0,
            votesAgainst: 0,
            status: Status.OPEN,
            employerWins: false,
            rewardPerWinner: 0
        });

        escrow.freeze(jobId);

        emit DisputeOpened(jobId, msg.sender, reason);
    }

    function vote(bytes32 jobId, bool supportEmployer) external {
        Dispute storage dispute = disputes[jobId];
        if (dispute.status != Status.OPEN) {
            revert InvalidStatus();
        }
        if (block.timestamp > dispute.openedAt + votingPeriod) {
            revert VotingClosed();
        }
        if (hasVoted[jobId][msg.sender]) {
            revert AlreadyVoted();
        }

        hasVoted[jobId][msg.sender] = true;
        voteSide[jobId][msg.sender] = supportEmployer;

        if (supportEmployer) {
            dispute.votesFor += 1;
        } else {
            dispute.votesAgainst += 1;
        }

        cbt.safeTransferFrom(msg.sender, address(treasury), voteCost);

        emit VoteCast(jobId, msg.sender, supportEmployer, voteCost);
    }

    function resolveDispute(bytes32 jobId) external {
        if (msg.sender != keeper) {
            revert Unauthorized();
        }
        Dispute storage dispute = disputes[jobId];
        if (dispute.status != Status.OPEN) {
            revert InvalidStatus();
        }
        if (block.timestamp <= dispute.openedAt + votingPeriod) {
            revert VotingOpen();
        }

        uint256 totalVoters = uint256(dispute.votesFor) + uint256(dispute.votesAgainst);
        bool employerWins = false;
        if (totalVoters < minVoters || dispute.votesFor == dispute.votesAgainst) {
            employerWins = true;
        } else if (dispute.votesFor > dispute.votesAgainst) {
            employerWins = true;
        }

        dispute.employerWins = employerWins;
        dispute.status = Status.RESOLVED;

        if (employerWins) {
            escrow.refundToPayer(jobId);
        } else {
            escrow.releaseToAgent(jobId);
        }

        uint256 winnerCount = employerWins ? dispute.votesFor : dispute.votesAgainst;
        uint256 rewardPerWinner = 0;
        if (winnerCount > 0) {
            uint256 serviceFee = escrow.serviceFeeOf(jobId);
            rewardPerWinner = serviceFee / winnerCount;
            uint256 totalReward = rewardPerWinner * winnerCount;
            if (totalReward > 0) {
                treasury.releaseReward(jobId, totalReward, address(this));
            }
        }
        dispute.rewardPerWinner = rewardPerWinner;

        emit DisputeResolved(jobId, employerWins);
    }

    function claimReward(bytes32 jobId) external {
        Dispute storage dispute = disputes[jobId];
        if (dispute.status != Status.RESOLVED) {
            revert InvalidStatus();
        }
        if (!hasVoted[jobId][msg.sender]) {
            revert Unauthorized();
        }
        if (hasClaimed[jobId][msg.sender]) {
            revert Unauthorized();
        }
        bool supportEmployer = voteSide[jobId][msg.sender];
        if (supportEmployer != dispute.employerWins) {
            revert NotWinner();
        }
        if (dispute.rewardPerWinner == 0) {
            revert NoReward();
        }

        hasClaimed[jobId][msg.sender] = true;
        cbt.safeTransfer(msg.sender, dispute.rewardPerWinner);
        emit RewardDistributed(jobId, msg.sender, dispute.rewardPerWinner);
    }
}
