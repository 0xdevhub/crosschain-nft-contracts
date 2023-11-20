// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IBaseAdapter} from "./interfaces/IBaseAdapter.sol";
import {IBridge} from "./interfaces/IBridge.sol";
import {IERC721, IERC721Metadata, IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "hardhat/console.sol";

contract Bridge is IBridge, AccessManaged {
    uint256 private immutable s_chainId;

    /// @dev evm chain settings
    mapping(uint256 => IBridge.ChainSettings) public s_evmChainSettings;

    /// @dev nonEvm chain to Evm
    mapping(uint256 => uint256) public s_nonEvmChains;

    constructor(address accessManagement_, uint256 chainId_) AccessManaged(accessManagement_) {
        s_chainId = chainId_;
    }

    /// @dev validate if chain settings are available
    modifier checkEvmChainAdapterIsValid(uint256 evmChainId_) {
        if (s_evmChainSettings[evmChainId_].adapter == address(0)) {
            revert IBridge.AdapterNotFound(evmChainId_);
        }
        _;
    }

    modifier checkEvmChainIdIsEnabled(uint256 evmChainId_) {
        if (!s_evmChainSettings[evmChainId_].isEnabled) {
            revert IBridge.AdapterNotEnabled(evmChainId_);
        }
        _;
    }

    modifier checkEvmChainByRampType(uint256 evmChainId_, IBridge.RampType rampType_) {
        if (s_evmChainSettings[evmChainId_].rampType != rampType_) {
            revert IBridge.RampTypeNotAllowed();
        }
        _;
    }

    /// @inheritdoc IBridge
    function chainId() public view returns (uint256) {
        return s_chainId;
    }

    /// @inheritdoc IBridge
    function setChainSetting(
        uint256 evmChainId_,
        uint256 nonEvmChainId_,
        address adapter_,
        IBridge.RampType rampType_,
        bool isEnabled_
    ) external restricted {
        s_evmChainSettings[evmChainId_] = IBridge.ChainSettings({
            nonEvmChainId: nonEvmChainId_,
            adapter: adapter_,
            rampType: rampType_,
            isEnabled: isEnabled_
        });

        /// @dev keep track of nonEvm to Evm chain
        _setNotEvmChainId(nonEvmChainId_, evmChainId_);

        emit IBridge.ChainSettingsSet(evmChainId_, nonEvmChainId_, adapter_);
    }

    function _setNotEvmChainId(uint256 nonEvmChainId_, uint256 evmChainId_) private {
        s_nonEvmChains[nonEvmChainId_] = evmChainId_;
    }

    /// @inheritdoc IBridge
    function getChainSettings(uint256 evmChainId_) public view returns (IBridge.ChainSettings memory) {
        return s_evmChainSettings[evmChainId_];
    }

    /// todo: check if to chain is allowed and enabled
    /// @inheritdoc IBridge
    function bridgeERC721(
        uint256 toChain_,
        address receiver_,
        address token_,
        uint256 tokenId_
    )
        external
        payable
        checkEvmChainAdapterIsValid(toChain_)
        checkEvmChainIdIsEnabled(toChain_)
        checkEvmChainByRampType(toChain_, IBridge.RampType.OnRamp)
    {
        ChainSettings memory chainSettings = getChainSettings(toChain_);

        IBridge.MessageSend memory payload = _getPayload(chainSettings.nonEvmChainId, token_, tokenId_, receiver_);

        IBaseAdapter adapter = IBaseAdapter(chainSettings.adapter);

        uint256 quotedFees = adapter.getFee(payload);

        if (quotedFees > msg.value) {
            revert IBridge.InsufficientFeeTokenAmount();
        }

        _receiveERC721(token_, tokenId_);
        _commitOnRamp(adapter, payload);

        emit IBridge.MessageSent(payload.toChain, payload.receiver, payload.data);
    }

    function _receiveERC721(address token_, uint256 tokenId_) private {
        IERC721(token_).safeTransferFrom(msg.sender, address(this), tokenId_);
    }

    function _getPayload(
        uint256 nonEvmChainId_,
        address token_,
        uint256 tokenId_,
        address receiver_
    ) internal view returns (IBridge.MessageSend memory) {
        IERC721Metadata tokenMetadata = IERC721Metadata(token_);

        string memory name = tokenMetadata.name();
        string memory symbol = tokenMetadata.symbol();
        string memory tokenURI = tokenMetadata.tokenURI(tokenId_);

        bytes memory data = _getEncodedPayloadData(token_, tokenId_, name, symbol, tokenURI);

        return IBridge.MessageSend({toChain: nonEvmChainId_, receiver: receiver_, data: data});
    }

    function _getEncodedPayloadData(
        address token_,
        uint256 tokenId_,
        string memory name_,
        string memory symbol_,
        string memory tokenURI_
    ) internal pure returns (bytes memory) {
        return abi.encode(token_, tokenId_, name_, symbol_, tokenURI_);
    }

    function _commitOnRamp(IBaseAdapter adapter_, IBridge.MessageSend memory payload_) private {
        adapter_.sendMessage(payload_);
    }

    /// @inheritdoc IBridge
    function commitOffRamp(
        IBridge.MessageReceive memory payload_
    )
        external
        override
        checkEvmChainAdapterIsValid(s_nonEvmChains[payload_.fromChain])
        checkEvmChainIdIsEnabled(s_nonEvmChains[payload_.fromChain])
        checkEvmChainByRampType(s_nonEvmChains[payload_.fromChain], IBridge.RampType.OffRamp)
        restricted
    {
        emit IBridge.MessageReceived(payload_.fromChain, payload_.sender, payload_.data);
    }

    /// @inheritdoc IBridge
    function onERC721Received(address operator, address, uint256, bytes calldata) external view returns (bytes4) {
        if (operator != address(this)) revert IBridge.TransferNotAllowed();
        return type(IERC721Receiver).interfaceId;
    }
}
