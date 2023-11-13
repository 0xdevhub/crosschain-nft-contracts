// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

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

    /// @notice Emitted when adapter is changed
    event AdapterChanged(address indexed adapter_);

    /// @notice Emitted when message is sent
    event MessageSent(MessageSend indexed message_);

    /// @notice Emitted when message is received
    event MessageReceived(MessageReceive indexed message_);

    /**
     * @notice get adapter address for crosschain message
     */
    function adapter() external view returns (address);

    /**
     * @notice set adapter for crosschain message
     * @param adapter_ new adapter address
     */
    function setAdapter(address adapter_) external;

    function lockAndMintERC721() external;

    function burnAndUnlockERC721() external;

    /**
     * @notice receive message from adapter
     * @param calldata_ encoded data received from adapter
     */
    function commitOffRamp(MessageReceive memory calldata_) external;
}
