// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface IBridge {
    enum RampType {
        OnRamp,
        OffRamp
    }

    struct EvmChainSettings {
        /// @todo: adapter settings (eg: gas limit) (e> could be bytes)
        uint256 nonEvmChainId;
        address adapter;
        RampType rampType;
        bool isEnabled;
    }

    struct WrappedERC721 {
        uint256 originChainId;
        address originAddress;
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

    struct MessageData {
        uint256 evmChainId;
        address token;
        uint256 tokenId;
        bytes metadata;
    }

    struct Metadata {
        string name;
        string symbol;
        string tokenURI;
    }

    error TransferNotAllowed();

    error InsufficientFeeTokenAmount();

    error AdapterNotFound(uint256 evmChainId_);

    error AdapterNotEnabled(uint256 evmChainId_);

    error RampTypeNotAllowed();

    event EvmChainSettingsSet(uint256 indexed evmChainId_, uint256 indexed chainId_, address adapter_);

    event MessageSent(uint256 toChain, address receiver, bytes data);

    event MessageReceived(uint256 fromChain, address sender, bytes data);

    event WrappedCreated(uint256 indexed originChainId_, address indexed originAddress_, address wrappedAddress_);

    function chainId() external view returns (uint256);

    function setChainSetting(
        uint256 evmChainId_,
        uint256 adapterChainId_,
        address adapter_,
        IBridge.RampType rampType_,
        bool isEnabled_
    ) external;

    function getChainSettings(uint256 evmChainId_) external view returns (IBridge.EvmChainSettings memory);

    function sendERC721(uint256 toChain_, address receiver_, address token_, uint256 tokenId_) external payable;

    function onERC721Received(address operator, address, uint256, bytes calldata) external view returns (bytes4);

    function receiveERC721(IBridge.MessageReceive memory payload_) external;
}
