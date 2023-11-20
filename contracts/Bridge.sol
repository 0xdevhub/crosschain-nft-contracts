// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IBaseAdapter} from "./interfaces/IBaseAdapter.sol";
import {IBridge} from "./interfaces/IBridge.sol";
import {ERC721, IERC721, IERC721Metadata, IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Bridge is IBridge, AccessManaged {
    mapping(uint256 => IBridge.ChainSettings) public s_chainSettings;

    constructor(address accessManagement_) AccessManaged(accessManagement_) {}

    modifier checkChainSettings(uint256 nativeChainId_) {
        if (s_chainSettings[nativeChainId_].adapter == address(0)) {
            revert IBridge.AdapterNotFound(nativeChainId_);
        }
        _;
    }

    /// @inheritdoc IBridge
    function setChainSetting(uint256 nativeChainId_, uint256 adapterChainId_, address adapter_) external restricted {
        s_chainSettings[nativeChainId_] = IBridge.ChainSettings({chainId: adapterChainId_, adapter: adapter_});

        emit IBridge.ChainSettingsSet(nativeChainId_, adapterChainId_, adapter_);
    }

    /// @inheritdoc IBridge
    function getChainSettings(uint256 nativeChainId_) public view returns (IBridge.ChainSettings memory) {
        return s_chainSettings[nativeChainId_];
    }

    /// @inheritdoc IBridge
    function transferERC721(
        uint256 toChain_,
        address receiver_,
        address token_,
        uint256 tokenId_
    ) external payable checkChainSettings(toChain_) {
        ChainSettings memory chainSettings = getChainSettings(toChain_);

        IBaseAdapter adapter = IBaseAdapter(chainSettings.adapter);

        IBridge.MessageSend memory payload = _getPayload(chainSettings.chainId, token_, tokenId_, receiver_);

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
        uint256 adapterChainId_,
        address token_,
        uint256 tokenId_,
        address receiver_
    ) internal view returns (IBridge.MessageSend memory) {
        IERC721Metadata tokenMetadata = IERC721Metadata(token_);
        string memory name = tokenMetadata.name();
        string memory symbol = tokenMetadata.symbol();
        string memory tokenURI = tokenMetadata.tokenURI(tokenId_);
        bytes memory data = _getPayloadData(token_, tokenId_, name, symbol, tokenURI);

        return IBridge.MessageSend({toChain: adapterChainId_, receiver: receiver_, data: data});
    }

    function _getPayloadData(
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
    function commitOffRamp(IBridge.MessageReceive memory payload_) external override restricted {
        emit IBridge.MessageReceived(payload_.fromChain, payload_.sender, payload_.data);
    }

    /// @inheritdoc IBridge
    function onERC721Received(address operator, address, uint256, bytes calldata) external view returns (bytes4) {
        if (operator != address(this)) revert IBridge.TransferNotAllowed();
        return type(IERC721Receiver).interfaceId;
    }
}
