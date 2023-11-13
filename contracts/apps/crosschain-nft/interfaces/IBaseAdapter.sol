// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IBridge} from "../interfaces/IBridge.sol";

interface IBaseAdapter {
    /// @dev error message for native token not supported
    error NativeTokenNotSupported();

    /// @dev emit when message sent
    event MessageSent(IBridge.MessageSend indexed data_);

    /// @dev emit when message received
    event MessageReceived(IBridge.MessageReceive indexed data_);

    /**
     * @notice get adapter router address
     */
    function router() external view returns (address);

    /**
     * @notice get protocol bridge address
     */
    function bridge() external view returns (address);

    /**
     * @notice get fee token for sending crosschain message
     * @return fee token address
     */
    function feeToken() external view returns (address);

    /**
     * @notice get fee for sending crosschain message
     * @param calldata_ payload to destruct and get fee
     */
    function getFee(bytes memory calldata_) external view returns (uint256);

    /**
     * @notice send crosschain message
     * @param calldata_ encoded payload do destruct and send
     * @dev only protocol can call
     */
    function sendMessage(IBridge.MessageSend memory calldata_) external;
}
