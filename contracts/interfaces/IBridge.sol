// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface IBridge {
    enum RampType {
        OnRamp,
        OffRamp
    }

    struct ChainSettings {
        /// todo: check if adapter requires transfer to the contract (e> not necessary now)
        /// todo: fees to use the transfer service (e> could be another struct)
        /// todo: adapter settings (eg: gas limit) (e> could be bytes)
        uint256 nonEvmChainId;
        address adapter;
        RampType rampType;
        bool isEnabled;
    }

    /// todo: define struct for messages to check lock/unlock burn/mint
    // struct ERC721TokenData {
    //     uint256 originChainId;
    //     address originAddress;
    //     address token;
    //     uint256 tokenId;
    //     string name;
    //     string symbol;
    //     string tokenURI;
    // }

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
    error AdapterNotFound(uint256 evmChainId_);

    /// @dev emitted when adapter not enabled
    error AdapterNotEnabled(uint256 evmChainId_);

    /// @dev emitted when adapter ramp type is not valid
    error RampTypeNotAllowed();

    /// @dev Emitted when adapter is changed
    event ChainSettingsSet(uint256 indexed evmChainId_, uint256 indexed chainId_, address adapter_);

    /// @dev Emitted when message is sent
    event MessageSent(uint256 toChain, address receiver, bytes data);

    /// @dev Emitted when message is received
    event MessageReceived(uint256 fromChain, address sender, bytes data);

    /**
     * @notice get chain id of the contract
     */
    function chainId() external view returns (uint256);

    /// todo: set wrapped asset manually/auto

    /**
     * @notice set chain settings
     * @param evmChainId_ native chain id to set
     * @param adapterChainId_ adapter chain id to set
     * @param adapter_ adapter address to set
     */
    function setChainSetting(
        uint256 evmChainId_,
        uint256 adapterChainId_,
        address adapter_,
        IBridge.RampType rampType_,
        bool isEnabled_
    ) external;

    /**
     * @notice get chain settings
     * @param evmChainId_ native chain id to get settings
     */
    function getChainSettings(uint256 evmChainId_) external view returns (IBridge.ChainSettings memory);

    /**
     * @notice transfer NFT sending crosschain message through adapter
     * @param toChain_ native chainId target
     * @param receiver_ receiver address
     * @param token_ token address of collection
     * @param tokenId_ token id to transfer
     */
    function bridgeERC721(uint256 toChain_, address receiver_, address token_, uint256 tokenId_) external payable;

    /**
     * @notice receive NFT transfers only by contract itself
     * @param operator address which called safeTransferFrom function
     */
    function onERC721Received(address operator, address, uint256, bytes calldata) external view returns (bytes4);

    /**
     * @notice receive message from adapter
     * @param payload_ data received from adapter
     */
    /// todo: isAllowedAdapter
    /// todo: isAllowedChain
    function commitOffRamp(IBridge.MessageReceive memory payload_) external;
}
