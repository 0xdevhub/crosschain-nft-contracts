// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IBaseAdapter} from "./IBaseAdapter.sol";

interface IBridge {
    struct MessageSend {
        uint256 toChain;
        address receiver;
        bytes data;
    }

    struct MessageReceive {
        uint256 fromChain;
        address sender;
        bytes data;
    }

    event AdapterChange(IBaseAdapter indexed adapter_);

    /**
     * @notice get adapter for crosschain message
     */
    function adapter() external view returns (IBaseAdapter);

    /**
     * @notice set adapter for crosschain message
     * @param adapter_ new adapter address
     */
    function setAdapter(IBaseAdapter adapter_) external;

    /**
     * @notice lock and mint ERC721 token
     * @dev only adapter can call
     */
    function lockAndMintERC721() external;

    /**
     * @notice burn and unlock ERC721 token
     * @dev only adapter can call
     */
    function burnAndUnlockERC721() external;

    /**
     * @notice receive message from adapter
     * @param calldata_ encoded calldata received from adapter
     */
    function commitOffRamp(MessageReceive memory calldata_) external;
}
