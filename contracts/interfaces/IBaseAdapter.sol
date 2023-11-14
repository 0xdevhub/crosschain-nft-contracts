// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IBridge} from "../interfaces/IBridge.sol";

interface IBaseAdapter {
    /// @dev error message for native token not supported
    error NativeTokenNotSupported();

    /// @dev emit when message sent
    event MessageSent(IBridge.MessageSend indexed data_);

    /// @dev emit when message received
    event MessageReceived(IBridge.MessageReceive indexed data_);

    /**
     * @notice {override} to get router address
     */
    function router() external view returns (address);

    /**
     * @notice {override} to get bridge address
     */
    function bridge() external view returns (address);

    /**
     * @notice {override} to return the required fee token
     */
    function feeToken() external view returns (address);

    /**
     * @notice {override} to return the required fee amount
     * @param payload_ data to send to router
     */
    function getFee(IBridge.MessageSend memory payload_) external view returns (uint256);

    /**
     * @notice {override} to send crosschain message
     * @param payload_ data to send to router
     */
    function sendMessage(IBridge.MessageSend memory payload_) external;
}
