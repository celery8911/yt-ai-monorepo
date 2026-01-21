// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

error ZeroAmount();
error TransferFailed();
error ZeroAddress();

contract CBT is ERC20, Ownable, Pausable {
    uint256 public rate;
    address public treasury;

    event Minted(address indexed buyer, uint256 ethIn, uint256 cbtOut);
    event RateUpdated(uint256 oldRate, uint256 newRate);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event PauseUpdated(bool paused);

    constructor(address treasury_, uint256 rate_) ERC20("CBT", "CBT") Ownable(msg.sender) {
        if (treasury_ == address(0)) {
            revert ZeroAddress();
        }
        treasury = treasury_;
        rate = rate_;
    }

    function buyCBT() external payable whenNotPaused {
        if (msg.value == 0) {
            revert ZeroAmount();
        }
        uint256 cbtOut = msg.value * rate;
        _mint(msg.sender, cbtOut);

        (bool ok, ) = treasury.call{value: msg.value}("");
        if (!ok) {
            revert TransferFailed();
        }

        emit Minted(msg.sender, msg.value, cbtOut);
    }

    function setRate(uint256 newRate) external onlyOwner {
        if (newRate == 0) {
            revert ZeroAmount();
        }
        uint256 oldRate = rate;
        rate = newRate;
        emit RateUpdated(oldRate, newRate);
    }

    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) {
            revert ZeroAddress();
        }
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    function setPaused(bool paused_) external onlyOwner {
        if (paused_) {
            _pause();
        } else {
            _unpause();
        }
        emit PauseUpdated(paused_);
    }
}
