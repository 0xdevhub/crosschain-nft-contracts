// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IBaseAdapter} from "../interfaces/IBaseAdapter.sol";

abstract contract BaseAdapter is IBaseAdapter {
    /**
     * @notice send crosschain message
     * @param calldata_ encoded payload do destruct and send
     */
    function sendMessage(bytes memory calldata_) external virtual override returns (bytes memory);

    /**
     * @notice get fee for sending crosschain message
     * @param calldata_ payload to destruct and get fee
     */
    function getFee(bytes memory calldata_) public view virtual override returns (uint256);

    /**
     * @notice get fee token for sending crosschain message
     * @return fee token address
     */
    function getFeeToken() public view virtual override returns (address);

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
