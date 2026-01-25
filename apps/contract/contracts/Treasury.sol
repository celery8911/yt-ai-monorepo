// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

error ZeroAddress();
error Unauthorized();
error InsufficientFee();
error TransferFailed();

contract Treasury is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable cbt;
    address public escrow;
    address public dao;
    mapping(address => bool) public authorizedCallers;

    mapping(bytes32 => uint256) public feeByJobId;

    event EscrowUpdated(address indexed oldEscrow, address indexed newEscrow);
    event DaoUpdated(address indexed oldDao, address indexed newDao);
    event AuthorizedCallerUpdated(address indexed caller, bool allowed);
    event ServiceFeeRecorded(bytes32 indexed jobId, uint256 amount);
    event RewardReleased(bytes32 indexed jobId, address indexed to, uint256 amount);
    event EthReceived(address indexed sender, uint256 amount);
    event EthWithdrawn(address indexed to, uint256 amount);
    event CBTWithdrawn(address indexed to, uint256 amount);

    constructor(address cbt_) Ownable(msg.sender) {
        if (cbt_ == address(0)) {
            revert ZeroAddress();
        }
        cbt = IERC20(cbt_);
    }

    receive() external payable {
        emit EthReceived(msg.sender, msg.value);
    }

    function setEscrow(address escrow_) external onlyOwner {
        if (escrow_ == address(0)) {
            revert ZeroAddress();
        }
        address oldEscrow = escrow;
        escrow = escrow_;
        if (oldEscrow != address(0)) {
            authorizedCallers[oldEscrow] = false;
            emit AuthorizedCallerUpdated(oldEscrow, false);
        }
        authorizedCallers[escrow_] = true;
        emit AuthorizedCallerUpdated(escrow_, true);
        emit EscrowUpdated(oldEscrow, escrow_);
    }

    function setDao(address dao_) external onlyOwner {
        if (dao_ == address(0)) {
            revert ZeroAddress();
        }
        address oldDao = dao;
        dao = dao_;
        emit DaoUpdated(oldDao, dao_);
    }

    function setAuthorizedCaller(address caller, bool allowed) external onlyOwner {
        if (caller == address(0)) {
            revert ZeroAddress();
        }
        authorizedCallers[caller] = allowed;
        emit AuthorizedCallerUpdated(caller, allowed);
    }

    function recordServiceFee(bytes32 jobId, uint256 amount) external {
        if (!authorizedCallers[msg.sender]) {
            revert Unauthorized();
        }
        feeByJobId[jobId] += amount;
        emit ServiceFeeRecorded(jobId, amount);
    }

    function releaseReward(bytes32 jobId, uint256 amount, address to) external {
        if (msg.sender != dao) {
            revert Unauthorized();
        }
        uint256 available = feeByJobId[jobId];
        if (amount > available) {
            revert InsufficientFee();
        }
        feeByJobId[jobId] = available - amount;
        cbt.safeTransfer(to, amount);
        emit RewardReleased(jobId, to, amount);
    }

    function withdrawETH(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) {
            revert ZeroAddress();
        }
        (bool ok, ) = to.call{value: amount}("");
        if (!ok) {
            revert TransferFailed();
        }
        emit EthWithdrawn(to, amount);
    }

    function withdrawCBT(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) {
            revert ZeroAddress();
        }
        cbt.safeTransfer(to, amount);
        emit CBTWithdrawn(to, amount);
    }
}
