// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IBridge} from "../interfaces/IBridge.sol";
import {IBaseAdapter} from "../interfaces/IBaseAdapter.sol";

abstract contract BaseAdapter is IBaseAdapter {
    IBridge public immutable bridge;

    constructor(IBridge bridge_) {
        bridge = bridge_;
    }

    /// @inheritdoc IBaseAdapter
    function sendMessage(bytes memory calldata_) external virtual override returns (bytes memory);

    /// @inheritdoc IBaseAdapter
    function getFee(bytes memory calldata_) public view virtual override returns (uint256);

    /// @inheritdoc IBaseAdapter
    function getFeeToken() public view virtual override returns (address);

    /**
     * @notice receive message from other chain
     * @param data_ encoded incoming message data
     */
    function _receiveMessage(bytes memory data_) internal virtual {
        bridge.commitOffRamp(data_);

        emit IBaseAdapter.MessageReceived(data_);
    }

    /// @dev enable to receive native token
    receive() external payable {
        if (getFeeToken() != address(0)) {
            revert IBaseAdapter.NativeTokenNotSupported();
        }
    }

    /// @dev prevent fallback calls
    fallback() external payable {
        revert();
    }
}
