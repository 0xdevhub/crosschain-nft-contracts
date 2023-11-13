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
    function getFee(bytes memory calldata_) public view virtual override returns (uint256);

    /// @inheritdoc IBaseAdapter
    function feeToken() public view virtual override returns (address);

    /// @inheritdoc IBaseAdapter
    /// @dev only bridge can call sendMessage
    function sendMessage(IBridge.MessageSend memory calldata_) external override restricted {
        _sendMessage(calldata_);
        emit IBaseAdapter.MessageSent(calldata_);
    }

    /**
     * @notice {override} to send crosschain message through adapter
     * @param calldata_ encoded data to send to router
     */
    function _sendMessage(IBridge.MessageSend memory calldata_) internal virtual;

    /**
     * @notice receive crosschain message from router
     * @param data_ encoded data to send to bridge
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
