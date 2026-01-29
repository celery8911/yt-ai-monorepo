// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface ITreasury {
    function recordServiceFee(bytes32 jobId, uint256 amount) external;
}

error ZeroAddress();
error ZeroAmount();
error EscrowExists();
error EscrowNotFound();
error InvalidStatus();
error TooEarly();
error Unauthorized();

contract Escrow is Ownable {
    using SafeERC20 for IERC20;

    enum Status {
        NONE,
        LOCKED,
        RELEASED,
        FROZEN,
        REFUNDED
    }

    struct EscrowInfo {
        address payer;
        address agent;
        uint128 price;
        uint128 serviceFee;
        uint40 releaseAt;
        Status status;
    }

    IERC20 public immutable cbt;
    ITreasury public treasury;
    address public dao;
    address public keeper;
    uint256 public serviceFeeBps;
    uint256 public releaseDelay;

    mapping(bytes32 => EscrowInfo) private escrows;
    bytes32[] private releaseQueue;
    uint256 private releaseHead;

    event PaymentCreated(bytes32 indexed jobId, address payer, address agent, uint256 price, uint256 serviceFee);
    event AutoReleaseScheduled(bytes32 indexed jobId, uint256 releaseAt);
    event AutoReleased(bytes32 indexed jobId, address agent, uint256 amount);
    event EscrowFrozen(bytes32 indexed jobId);
    event EscrowRefunded(bytes32 indexed jobId, address payer, uint256 amount);
    event DaoUpdated(address indexed oldDao, address indexed newDao);
    event KeeperUpdated(address indexed oldKeeper, address indexed newKeeper);
    event ServiceFeeUpdated(uint256 oldBps, uint256 newBps);
    event ReleaseDelayUpdated(uint256 oldDelay, uint256 newDelay);

    constructor(
        address cbt_,
        address treasury_,
        uint256 serviceFeeBps_,
        uint256 releaseDelay_
    ) Ownable(msg.sender) {
        if (cbt_ == address(0) || treasury_ == address(0)) {
            revert ZeroAddress();
        }
        cbt = IERC20(cbt_);
        treasury = ITreasury(treasury_);
        serviceFeeBps = serviceFeeBps_;
        releaseDelay = releaseDelay_;
    }

    function setDao(address dao_) external onlyOwner {
        if (dao_ == address(0)) {
            revert ZeroAddress();
        }
        address oldDao = dao;
        dao = dao_;
        emit DaoUpdated(oldDao, dao_);
    }

    function setKeeper(address keeper_) external onlyOwner {
        if (keeper_ == address(0)) {
            revert ZeroAddress();
        }
        address oldKeeper = keeper;
        keeper = keeper_;
        emit KeeperUpdated(oldKeeper, keeper_);
    }

    function setServiceFeeBps(uint256 newBps) external onlyOwner {
        uint256 oldBps = serviceFeeBps;
        serviceFeeBps = newBps;
        emit ServiceFeeUpdated(oldBps, newBps);
    }

    function setReleaseDelay(uint256 newDelay) external onlyOwner {
        uint256 oldDelay = releaseDelay;
        releaseDelay = newDelay;
        emit ReleaseDelayUpdated(oldDelay, newDelay);
    }

    function createEscrow(bytes32 jobId, address payer, address agent, uint256 price) external {
        if (payer == address(0) || agent == address(0)) {
            revert ZeroAddress();
        }
        if (price == 0) {
            revert ZeroAmount();
        }
        if (escrows[jobId].status != Status.NONE) {
            revert EscrowExists();
        }

        uint256 fee = (price * serviceFeeBps) / 10_000;
        uint256 releaseAt = block.timestamp + releaseDelay;

        cbt.safeTransferFrom(msg.sender, address(this), price);
        if (fee > 0) {
            cbt.safeTransferFrom(msg.sender, address(treasury), fee);
            treasury.recordServiceFee(jobId, fee);
        }

        escrows[jobId] = EscrowInfo({
            payer: payer,
            agent: agent,
            price: uint128(price),
            serviceFee: uint128(fee),
            releaseAt: uint40(releaseAt),
            status: Status.LOCKED
        });
        releaseQueue.push(jobId);

        emit PaymentCreated(jobId, payer, agent, price, fee);
        emit AutoReleaseScheduled(jobId, releaseAt);
    }

    function scheduleRelease(bytes32 jobId) external {
        EscrowInfo storage escrow = escrows[jobId];
        if (escrow.status != Status.LOCKED) {
            revert InvalidStatus();
        }
        if (escrow.releaseAt != 0) {
            return;
        }
        uint40 releaseAt = uint40(block.timestamp + releaseDelay);
        escrow.releaseAt = releaseAt;
        emit AutoReleaseScheduled(jobId, releaseAt);
    }

    function autoRelease(bytes32 jobId) external {
        if (msg.sender != keeper) {
            revert Unauthorized();
        }
        EscrowInfo storage escrow = escrows[jobId];
        if (escrow.status != Status.LOCKED) {
            revert InvalidStatus();
        }
        if (block.timestamp < escrow.releaseAt) {
            revert TooEarly();
        }
        _releaseToAgent(jobId, escrow);
    }

    function releaseReady() external {
        if (msg.sender != keeper) {
            revert Unauthorized();
        }
        for (uint256 i = releaseHead; i < releaseQueue.length; i++) {
            bytes32 jobId = releaseQueue[i];
            EscrowInfo storage escrow = escrows[jobId];
            if (escrow.status == Status.RELEASED || escrow.status == Status.REFUNDED) {
                if (i == releaseHead) {
                    releaseHead += 1;
                }
                continue;
            }
            if (escrow.status != Status.LOCKED) {
                if (i == releaseHead) {
                    releaseHead += 1;
                }
                continue;
            }
            if (block.timestamp < escrow.releaseAt) {
                continue;
            }
            _releaseToAgent(jobId, escrow);
            if (i == releaseHead) {
                releaseHead += 1;
            }
            return;
        }
    }

    function freeze(bytes32 jobId) external {
        if (msg.sender != dao) {
            revert Unauthorized();
        }
        EscrowInfo storage escrow = escrows[jobId];
        if (escrow.status != Status.LOCKED) {
            revert InvalidStatus();
        }
        escrow.status = Status.FROZEN;
        emit EscrowFrozen(jobId);
    }

    function releaseToAgent(bytes32 jobId) external {
        if (msg.sender != dao) {
            revert Unauthorized();
        }
        EscrowInfo storage escrow = escrows[jobId];
        if (escrow.status != Status.LOCKED && escrow.status != Status.FROZEN) {
            revert InvalidStatus();
        }
        _releaseToAgent(jobId, escrow);
    }

    function refundToPayer(bytes32 jobId) external {
        if (msg.sender != dao) {
            revert Unauthorized();
        }
        EscrowInfo storage escrow = escrows[jobId];
        if (escrow.status != Status.LOCKED && escrow.status != Status.FROZEN) {
            revert InvalidStatus();
        }
        escrow.status = Status.REFUNDED;
        cbt.safeTransfer(escrow.payer, escrow.price);
        emit EscrowRefunded(jobId, escrow.payer, escrow.price);
    }

    function _releaseToAgent(bytes32 jobId, EscrowInfo storage escrow) private {
        escrow.status = Status.RELEASED;
        cbt.safeTransfer(escrow.agent, escrow.price);
        emit AutoReleased(jobId, escrow.agent, escrow.price);
    }

    function payerOf(bytes32 jobId) external view returns (address) {
        EscrowInfo storage escrow = escrows[jobId];
        if (escrow.status == Status.NONE) {
            revert EscrowNotFound();
        }
        return escrow.payer;
    }

    function agentOf(bytes32 jobId) external view returns (address) {
        EscrowInfo storage escrow = escrows[jobId];
        if (escrow.status == Status.NONE) {
            revert EscrowNotFound();
        }
        return escrow.agent;
    }

    function serviceFeeOf(bytes32 jobId) external view returns (uint256) {
        EscrowInfo storage escrow = escrows[jobId];
        if (escrow.status == Status.NONE) {
            revert EscrowNotFound();
        }
        return escrow.serviceFee;
    }

    function statusOf(bytes32 jobId) external view returns (Status) {
        return escrows[jobId].status;
    }
}
