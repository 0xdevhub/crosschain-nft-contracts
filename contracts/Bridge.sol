// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IBaseAdapter} from "./interfaces/IBaseAdapter.sol";
import {IBridge} from "./interfaces/IBridge.sol";
import {ERC721, IERC721, IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Bridge is IBridge, AccessManaged {
    /// @dev nativeChainId => chainId => adapter
    mapping(uint256 => IBridge.AdapterSettings) public s_adapters;

    constructor(address accessManagement_) AccessManaged(accessManagement_) {}

    modifier checkAdapter(uint256 nativeChainId_) {
        if (s_adapters[nativeChainId_].adapter == address(0)) {
            revert IBridge.AdapterNotFound(nativeChainId_);
        }
        _;
    }

    /// @inheritdoc IBridge
    function setAdapter(uint256 nativeChainId_, uint256 chainId_, address adapter_) external restricted {
        s_adapters[nativeChainId_] = IBridge.AdapterSettings({chainId: chainId_, adapter: adapter_});

        emit IBridge.AdapterSet(nativeChainId_, chainId_, adapter_);
    }

    /// @inheritdoc IBridge
    function adapters(uint256 nativeChainId_) public view returns (IBridge.AdapterSettings memory) {
        return s_adapters[nativeChainId_];
    }

    /// @inheritdoc IBridge
    function transferERC721(
        uint256 toChain_,
        address receiver_,
        address token_,
        uint256 tokenId_
    ) external payable checkAdapter(toChain_) {
        AdapterSettings memory chainAdapter = adapters(toChain_);

        IBaseAdapter adapter = IBaseAdapter(chainAdapter.adapter);

        uint256 chainId = chainAdapter.chainId;

        ERC721 token = ERC721(token_);

        bytes memory data = abi.encode(token_, tokenId_, token.name(), token.symbol(), token.tokenURI(tokenId_));

        IBridge.MessageSend memory payload = IBridge.MessageSend({toChain: chainId, receiver: receiver_, data: data});

        uint256 quotedFees = adapter.getFee(payload);
        if (quotedFees > msg.value) {
            revert IBridge.InsufficientFeeTokenAmount();
        }

        IERC721(token_).safeTransferFrom(msg.sender, address(this), tokenId_);

        adapter.sendMessage(payload);

        emit IBridge.MessageSent(payload.toChain, payload.receiver, payload.data);
    }

    /// todo: isAllowedSender
    /// todo: isAllowedSourceChain
    /// todo: set wrapped asset or create wrapped on lock
    /// @inheritdoc IBridge
    /// @dev only adapter can call
    function commitOffRamp(IBridge.MessageReceive memory payload_) external override restricted {
        emit IBridge.MessageReceived(payload_.fromChain, payload_.sender, payload_.data);
    }

    /// @inheritdoc IBridge
    function onERC721Received(address operator, address, uint256, bytes calldata) external view returns (bytes4) {
        if (operator != address(this)) revert IBridge.TransferNotAllowed();
        return type(IERC721Receiver).interfaceId;
    }
}
