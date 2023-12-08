// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IBaseAdapter} from "./IBaseAdapter.sol";

interface IBridge {
    enum RampType {
        OnRamp,
        OffRamp
    }

    struct EvmChainSettings {
        uint256 evmChainId;
        uint256 nonEvmChainId;
        address adapter;
        bool isEnabled;
        /// @dev gas limit to be used for the adapter
        uint256 gasLimit;
    }

    struct ERC721Wrapped {
        /// @dev origin token address
        address originAddress;
        /// @dev origin evm chain id
        uint256 evmChainId;
        /// @dev wrapped token address
        address wrappedAddress;
    }

    /// @dev ERC721 bridge message data
    struct ERC721Data {
        address receiver;
        bytes token; /// @dev ERC721Token
        bytes metadata; /// @dev ERC721Metadata
    }

    /// @dev Decoded ERC721 token message
    struct ERC721Token {
        uint256 evmChainId;
        address tokenAddress;
        uint256 tokenId;
    }

    /// @dev Decoded ERC721 token metadata message
    struct ERC721Metadata {
        string name;
        string symbol;
        string tokenURI;
    }

    error TransferNotAllowed();

    error InsufficientFeeTokenAmount();

    error AdapterNotFound();

    error AdapterNotEnabled();

    error OperationNotSupported();

    error ERC721WrappedCreationFailed();

    event EvmChainSettingsSet(uint256 indexed evmChainId_, RampType indexed rampType_);

    event ERC721Sent(uint256 evmChainId_, address receiver_, bytes data_);

    event ERC721Received(uint256 evmChainId_, address sender_, bytes data_);

    event ERC721WrappedCreated(
        uint256 indexed evmChainId_,
        address indexed originAddress_,
        address indexed wrappedAddress_
    );

    /// @dev Returns the chain id of the current chain
    function chainId() external view returns (uint256);

    /**
     * @notice setup new adapter for the given evm chain id
     * @param evmChainId_ Evm chain ID for the destionation/source chain
     * @param nonEvmChainId_ Non evm chain ID that is required for the destionation/source chain to communicate
     * @param adapter_ Address of the adapter contract that handle messages crosschain
     * @param rampType_ Type of the adapter, onRamp or offRamp
     * @param isEnabled_ Enable or disable the adapter
     * @param gasLimit_ Gas limit to be used for the adapter handling messages
     */

    function setEvmChainIdSetting(
        uint256 evmChainId_,
        uint256 nonEvmChainId_,
        address adapter_,
        RampType rampType_,
        bool isEnabled_,
        uint256 gasLimit_
    ) external;

    function getEvmChainIdSettings(
        uint256 evmChainId_,
        RampType rampType_
    ) external view returns (EvmChainSettings memory);

    function setWERC721ByOriginERC721Address(
        address originAddress_,
        uint256 evmChainId,
        address wrappedAddress
    ) external;

    function getWERC721ByOriginERC721Address(address originAddress_) external view returns (ERC721Wrapped memory);

    function sendERC721UsingERC20(
        uint256 evmChainId_,
        address ERC721Address_,
        uint256 tokenId_,
        uint256 quotedFee_
    ) external;

    function sendERC721UsingNative(uint256 evmChainId_, address ERC721Address_, uint256 tokenId_) external payable;

    function onERC721Received(address operator, address, uint256, bytes calldata) external view returns (bytes4);

    function receiveERC721(IBaseAdapter.MessageReceive memory payload_) external;
}
