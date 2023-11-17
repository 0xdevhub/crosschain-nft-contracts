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

    struct AdapterSettings {
        uint256 abstractedChainId;
        address adapter;
    }

    /// @notice Emitted when adapter is changed
    event AdapterChanged(uint256 indexed nativeChainId_, uint256 indexed abstractedChainId_, address adapter_);

    /// @notice Emitted when message is sent
    event MessageSent(MessageSend indexed message_);

    /// @notice Emitted when message is received
    event MessageReceived(MessageReceive indexed message_);

    /// @dev emitted when not enough fee token amount
    error InsufficientFeeTokenAmount();

    /// @dev emitted when adapter not found
    error AdapterNotFound(uint256 nativeChainId_);

    /**
     * @notice set adapter address from native chainId and abstracted chainId
     * @param nativeChainId_ native chain id
     * @param abstractedChainId_ abstracted chain id
     * @param adapter_ address of adapter
     */
    function setAdapter(uint256 nativeChainId_, uint256 abstractedChainId_, address adapter_) external;

    /**
     * @notice get adapter address by native chainId
     * @param nativeChainId_ native chain id
     * @return adapter struct
     */
    function adapters(uint256 nativeChainId_) external view returns (IBridge.AdapterSettings memory);

    /**
     * @notice transfer NFT sending crosschain message through adapter
     * @param toChain_ native chainId target
     * @param receiver_ receiver address
     * @param token_ token address of collection
     * @param tokenId_ token id to transfer
     */
    function transferToChain(uint256 toChain_, address receiver_, address token_, uint256 tokenId_) external payable;

    /**
     * @notice receive message from adapter
     * @param calldata_ data received from adapter
     */
    function receiveFromChain(MessageReceive memory calldata_) external;
}
