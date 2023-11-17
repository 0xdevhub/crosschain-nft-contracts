// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IBridge} from "../interfaces/IBridge.sol";

interface IBaseAdapter {
    /// @dev emitted when not enough fee token amount
    error InsufficientFeeTokenAmount();

    /// @dev emmited when calling fallback function
    error FallbackNotAllowed();

    /// @dev emitted when calling receive function
    error DepositNotAllowed();

    /// @dev emit when message sent
    event MessageSent(uint256 toChain_, address receiver_, bytes data_);

    /// @dev emit when message received
    event MessageReceived(uint256 fromChain_, address sender_, bytes data_);

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
    function sendMessage(IBridge.MessageSend memory payload_) external payable;
}
