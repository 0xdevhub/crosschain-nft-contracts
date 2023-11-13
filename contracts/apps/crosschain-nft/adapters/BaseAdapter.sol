// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IBridge} from "../interfaces/IBridge.sol";
import {IBaseAdapter} from "../interfaces/IBaseAdapter.sol";

abstract contract BaseAdapter is IBaseAdapter {
    /// @dev protocol bridge address set once on construction
    address private immutable s_bridge;

    constructor(address bridge_) {
        s_bridge = bridge_;
    }

    /// @inheritdoc IBaseAdapter
    function bridge() public view override returns (address) {
        return s_bridge;
    }

    /// @inheritdoc IBaseAdapter
    function router() public view virtual returns (address);

    /// @inheritdoc IBaseAdapter
    function getFee(bytes memory calldata_) public view virtual override returns (uint256);

    /// @inheritdoc IBaseAdapter
    function feeToken() public view virtual override returns (address);

    /// @inheritdoc IBaseAdapter
    function sendMessage(IBridge.MessageSend memory calldata_) external virtual override;

    /**
     * @notice receive message from other chain
     * @param data_ encoded incoming message data
     */
    function _receiveMessage(IBridge.MessageReceive memory data_) internal virtual {
        IBridge(s_bridge).commitOffRamp(data_);
        emit IBaseAdapter.MessageReceived(data_);
    }

    /// @dev enable to receive native token
    receive() external payable {
        if (feeToken() != address(0)) {
            revert IBaseAdapter.NativeTokenNotSupported();
        }
    }

    /// @dev prevent fallback calls
    fallback() external payable {
        revert();
    }
}
