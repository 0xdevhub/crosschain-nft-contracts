// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IBaseAdapter {
    /// @dev error message for native token not supported
    error NativeTokenNotSupported();

    /// @dev emit when message sent
    event MessageSent(bytes indexed data_);

    /// @dev emit when message received
    event MessageReceived(bytes indexed data_);

    /**
     * @notice get fee for sending crosschain message
     * @param calldata_ payload to destruct and get fee
     */
    function getFee(bytes memory calldata_) external view returns (uint256);

    /**
     * @notice send crosschain message
     * @param calldata_ encoded payload do destruct and send
     */
    function sendMessage(bytes memory calldata_) external returns (bytes memory);

    /**
     * @notice get fee token for sending crosschain message
     * @return fee token address
     */
    function getFeeToken() external view returns (address);
}
