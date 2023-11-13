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
     * @param calldata_ encoded data to send
     */
    function getFee(bytes memory calldata_) external view returns (uint256);

    /**
     * @notice {override} to send crosschain message
     * @param calldata_ encoded data to send
     */
    function sendMessage(IBridge.MessageSend memory calldata_) external;
}
