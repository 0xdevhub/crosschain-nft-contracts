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

    struct ERC721Wrapped {
        uint256 originChainId;
        address originAddress;
    }

    struct ERC721Receive {
        uint256 fromChain;
        address sender;
        bytes data; // ERC721Data
    }

    struct ERC721Send {
        uint256 toChain;
        address receiver;
        bytes data; // ERC721Data
    }

    struct ERC721Data {
        address receiver;
        bytes token; // @dev ERC721Token
        bytes metadata; // @dev ERC721Metadata
    }

    struct ERC721Token {
        uint256 evmChainId;
        address token;
        uint256 tokenId;
    }

    struct ERC721Metadata {
        string name;
        string symbol;
        string tokenURI;
    }

    error TransferNotAllowed();

    error InsufficientFeeTokenAmount();

    error AdapterNotFound(uint256 evmChainId_);

    error AdapterNotEnabled(uint256 evmChainId_);

    error RampTypeNotAllowed();

    event EvmChainSettingsSet(uint256 indexed evmChainId_, uint256 indexed nonEvmChainId_, address adapter_);

    event ERC721Sent(uint256 evmChainId_, address receiver_, bytes data_);

    event ERC721Received(uint256 evmChainId_, address sender_, bytes data_);

    event ERC721WrappedCreated(uint256 indexed originChainId_, address indexed originAddress_, address wrappedAddress_);

    function chainId() external view returns (uint256);

    function setChainSetting(
        uint256 evmChainId_,
        uint256 nonEvmChainId_,
        address adapter_,
        IBridge.RampType rampType_,
        bool isEnabled_
    ) external;

    function getChainSettings(uint256 evmChainId_) external view returns (IBridge.EvmChainSettings memory);

    function sendERC721(uint256 evmChainId_, address token_, uint256 tokenId_) external payable;

    function onERC721Received(address operator, address, uint256, bytes calldata) external view returns (bytes4);

    function receiveERC721(IBridge.ERC721Receive memory payload_) external;

    function setERC721WrappedToken(address token_, uint256 originChainId_, address originAddress_) external;
}
