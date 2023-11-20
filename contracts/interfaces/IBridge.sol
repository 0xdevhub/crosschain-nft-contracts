// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface IBridge {
    struct ChainSettings {
        /// todo: check if is enabled to use
        /// todo: check if adapter requires transfer to the contract
        /// todo: fees to use the transfer service
        uint256 chainId;
        address adapter;
    }

    struct MessageReceive {
        uint256 fromChain;
        address sender;
        bytes data;
    }

    struct MessageSend {
        uint256 toChain;
        address receiver;
        bytes data;
    }

    /// @dev emitted when try to transfer to contract
    error TransferNotAllowed();

    /// @dev emitted when not enough fee token amount
    error InsufficientFeeTokenAmount();

    /// @dev emitted when adapter not found
    error AdapterNotFound(uint256 nativeChainId_);

    /// @dev Emitted when adapter is changed
    event ChainSettingsSet(uint256 indexed nativeChainId_, uint256 indexed chainId_, address adapter_);

    /// @dev Emitted when message is sent
    event MessageSent(uint256 toChain, address receiver, bytes data);

    /// @dev Emitted when message is received
    event MessageReceived(uint256 fromChain, address sender, bytes data);

    /**
     * @notice set chain settings
     * @param nativeChainId_ native chain id to set
     * @param adapterChainId_ adapter chain id to set
     * @param adapter_ adapter address to set
     */
    function setChainSetting(uint256 nativeChainId_, uint256 adapterChainId_, address adapter_) external;

    /**
     * @notice get chain settings
     * @param nativeChainId_ native chain id to get settings
     */
    function getChainSettings(uint256 nativeChainId_) external view returns (IBridge.ChainSettings memory);

    /**
     * @notice transfer NFT sending crosschain message through adapter
     * @param toChain_ native chainId target
     * @param receiver_ receiver address
     * @param token_ token address of collection
     * @param tokenId_ token id to transfer
     */
    function transferERC721(uint256 toChain_, address receiver_, address token_, uint256 tokenId_) external payable;

    /**
     * @notice receive NFT transfers
     * @param operator address which called safeTransferFrom function
     */
    function onERC721Received(address operator, address, uint256, bytes calldata) external view returns (bytes4);

    /**
     * @notice receive message from adapter
     * @param payload_ data received from adapter
     */
    /// todo: isAllowedSender
    /// todo: isAllowedSourceChain
    /// todo: set wrapped asset or create wrapped on lock
    function commitOffRamp(IBridge.MessageReceive memory payload_) external;
}
