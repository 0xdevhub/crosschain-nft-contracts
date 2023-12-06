// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IBridge} from "../interfaces/IBridge.sol";
import {IBaseAdapter} from "../interfaces/IBaseAdapter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

abstract contract BaseAdapter is IBaseAdapter, AccessManaged {
    address private immutable s_bridge;
    address private immutable s_feeToken;

    constructor(address bridge_, address accessManagement_, address feeToken_) AccessManaged(accessManagement_) {
        s_feeToken = feeToken_;
        s_bridge = bridge_;
    }

    /// @inheritdoc IBaseAdapter
    function getBridge() public view override returns (address) {
        return s_bridge;
    }

    /// @inheritdoc IBaseAdapter
    function getFee(IBaseAdapter.MessageSend memory payload_) public view virtual override returns (uint256);

    /// @inheritdoc IBaseAdapter
    function feeToken() public view virtual override returns (address) {
        return s_feeToken;
    }

    /// @inheritdoc IBaseAdapter
    function sendMessageUsingERC20(
        IBaseAdapter.MessageSend memory payload_,
        uint256 quotedFee_
    ) external override restricted {
        if (quotedFee_ < getFee(payload_)) revert InsufficientFeeTokenAmount();

        _sendMessage(payload_, quotedFee_);
        emit IBaseAdapter.MessageSent(payload_.toChain, payload_.receiver, payload_.data);
    }

    /// @inheritdoc IBaseAdapter
    function sendMessageUsingNative(IBaseAdapter.MessageSend memory payload_) external payable override restricted {
        if (msg.value < getFee(payload_)) revert InsufficientFeeTokenAmount();

        _sendMessage(payload_, msg.value);
        emit IBaseAdapter.MessageSent(payload_.toChain, payload_.receiver, payload_.data);
    }

    function _sendMessage(IBaseAdapter.MessageSend memory payload_, uint256 quotedFee_) internal virtual;

    function _receiveMessage(IBaseAdapter.MessageReceive memory payload_) internal virtual {
        IBridge(s_bridge).receiveERC721(payload_);
        emit IBaseAdapter.MessageReceived(payload_.fromChain, payload_.sender, payload_.data);
    }

    /// @dev prevent to receive native token
    receive() external payable {
        revert DepositNotAllowed();
    }

    /// @dev prevent fallback calls
    fallback() external payable {
        revert FallbackNotAllowed();
    }
}
