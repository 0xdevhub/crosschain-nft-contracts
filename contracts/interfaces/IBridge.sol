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
        uint256 adapterChainId;
        address adapter;
    }

    /// @dev emitted when try to transfer to contract
    error TransferNotAllowed();

    /// @dev emitted when not enough fee token amount
    error InsufficientFeeTokenAmount();

    /// @dev emitted when adapter not found
    error AdapterNotFound(uint256 nativeChainId_);

    /// @dev Emitted when adapter is changed
    event AdapterSet(uint256 indexed nativeChainId_, uint256 indexed adapterChainId_, address adapter_);

    /// @dev Emitted when message is sent
    event MessageSent(MessageSend indexed message_);

    /// @dev Emitted when message is received
    event MessageReceived(MessageReceive indexed message_);

    /// @dev Emitted when NFT is transfered to another chain
    event TransferedToChain(uint256 indexed toChain_, address indexed receiver_, address token_, uint256 tokenId_);

    /**
     * @notice set adapter address from native chainId and abstracted chainId
     * @param nativeChainId_ native chain id
     * @param adapterChainId_ abstracted chain id
     * @param adapter_ address of adapter
     */
    function setAdapter(uint256 nativeChainId_, uint256 adapterChainId_, address adapter_) external;

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
     * @notice receive NFT transfers
     * @param operator address which called safeTransferFrom function
     */
    function onERC721Received(address operator, address, uint256, bytes calldata) external view returns (bytes4);

    /**
     * @notice receive message from adapter
     * @param payload_ data received from adapter
     */
    function receiveFromChain(MessageReceive memory payload_) external;
}
