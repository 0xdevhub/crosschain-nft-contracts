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
        uint256 gasLimit;
    }

    struct ERC721Wrapped {
        uint256 originEvmChainId;
        address originAddress;
        address wrappedAddress;
    }

    struct ERC721Data {
        address receiver;
        bytes token; /// @dev ERC721Token
        bytes metadata; /// @dev ERC721Metadata
    }

    struct ERC721Token {
        uint256 evmChainId;
        address tokenAddress;
        uint256 tokenId;
    }

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

    event EvmChainSettingsSet(uint256 indexed evmChainId_, RampType indexed rampType_);
    event ERC721Sent(uint256 evmChainId_, address receiver_, bytes data_);
    event ERC721Received(uint256 evmChainId_, address sender_, bytes data_);
    event ERC721WrappedCreated(
        uint256 indexed originChainId_,
        address indexed originAddress_,
        address indexed wrappedAddress_
    );

    function chainId() external view returns (uint256);

    function setChainSetting(
        uint256 evmChainId_,
        uint256 nonEvmChainId_,
        address adapter_,
        RampType rampType_,
        bool isEnabled_,
        uint256 gasLimit_
    ) external;

    function getChainSettings(uint256 evmChainId_, RampType rampType_) external view returns (EvmChainSettings memory);

    function sendERC721UsingERC20(uint256 evmChainId_, address token_, uint256 tokenId_, uint256 quotedFee_) external;

    function sendERC721UsingNative(uint256 evmChainId_, address token_, uint256 tokenId_) external payable;

    function onERC721Received(address operator, address, uint256, bytes calldata) external view returns (bytes4);

    function receiveERC721(IBaseAdapter.MessageReceive memory payload_) external;

    function setERC721WrappedToken(address wrappedAddress_, uint256 originEvmChainId, address originAddress) external;
}
