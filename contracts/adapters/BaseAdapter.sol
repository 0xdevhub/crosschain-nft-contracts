// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IBridge} from "../interfaces/IBridge.sol";
import {IBaseAdapter} from "../interfaces/IBaseAdapter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

abstract contract BaseAdapter is IBaseAdapter, AccessManaged {
    /// @dev bridge address set once in constructor
    address private immutable s_bridge;

    constructor(address bridge_, address accessManagement_) AccessManaged(accessManagement_) {
        s_bridge = bridge_;
    }

    /// @inheritdoc IBaseAdapter
    function bridge() public view override returns (address) {
        return s_bridge;
    }

    /// @inheritdoc IBaseAdapter
    function router() public view virtual returns (address);

    /// @inheritdoc IBaseAdapter
    function getFee(IBridge.ERC721Send memory payload_) public view virtual override returns (uint256);

    /// @inheritdoc IBaseAdapter
    function feeToken() public view virtual override returns (address) {
        return address(0);
    }

    /// @inheritdoc IBaseAdapter
    function sendMessageUsingERC20(
        IBridge.ERC721Send memory payload_,
        uint256 quotedFee_
    ) external override restricted {
        /// @dev check if there is enough fee token amount
        if (quotedFee_ < getFee(payload_)) revert InsufficientFeeTokenAmount();

        _sendMessage(payload_, quotedFee_);
        emit IBaseAdapter.ERC721Sent(payload_.toChain, payload_.receiver, payload_.data);
    }

    /// @inheritdoc IBaseAdapter
    function sendMessageUsingNative(IBridge.ERC721Send memory payload_) external payable override restricted {
        /// @dev check if there is enough fee token amount
        if (msg.value < getFee(payload_)) revert InsufficientFeeTokenAmount();

        _sendMessage(payload_, msg.value);
        emit IBaseAdapter.ERC721Sent(payload_.toChain, payload_.receiver, payload_.data);
    }

    ///@dev override this function to send message using your implementation
    function _sendMessage(IBridge.ERC721Send memory payload_, uint256 quotedFee_) internal virtual;

    function _receiveMessage(IBridge.ERC721Receive memory payload_) internal virtual {
        IBridge(s_bridge).receiveERC721(payload_);
        emit IBaseAdapter.ERC721Receive(payload_.fromChain, payload_.sender, payload_.data);
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
