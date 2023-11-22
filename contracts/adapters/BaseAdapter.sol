// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IBridge} from "../interfaces/IBridge.sol";
import {IBaseAdapter} from "../interfaces/IBaseAdapter.sol";

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
    function feeToken() public pure override returns (address) {
        return address(0);
    }

    /// @inheritdoc IBaseAdapter
    function sendMessage(IBridge.ERC721Send memory payload_) external payable override restricted {
        uint256 quotedFee = getFee(payload_);

        if (msg.value < quotedFee) {
            revert InsufficientFeeTokenAmount();
        }

        _sendMessage(payload_, quotedFee);
        emit IBaseAdapter.ERC721Sent(payload_.toChain, payload_.receiver, payload_.data);
    }

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
