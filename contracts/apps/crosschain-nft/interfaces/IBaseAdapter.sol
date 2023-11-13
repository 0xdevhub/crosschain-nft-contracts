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
     * @notice get router address
     */
    function router() external view returns (address);

    /**
     * @notice get bridge address
     */
    function bridge() external view returns (address);

    /**
     * @notice get fee token to sending crosschain message through router
     * @return fee token address
     */
    function feeToken() external view returns (address);

    /**
     * @notice get fee amount to sending crosschain message through router
     * @param calldata_ encoded data to send to router
     */
    function getFee(bytes memory calldata_) external view returns (uint256);

    /**
     * @notice send crosschain message through router
     * @param calldata_ encoded data to send to router
     */
    function sendMessage(IBridge.MessageSend memory calldata_) external;
}
