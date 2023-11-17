// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IBaseAdapter} from "./interfaces/IBaseAdapter.sol";
import {IBridge} from "./interfaces/IBridge.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Bridge is IBridge, AccessManaged {
    /// @dev nativeChainId => abstractedChainId => adapter
    mapping(uint256 => IBridge.AdapterSettings) public s_adapters;

    /**
     * @notice initialize bridge
     * @param accessManagement_ address of access management contract
     */
    constructor(address accessManagement_) AccessManaged(accessManagement_) {}

    modifier checkAdapter(uint256 nativeChainId_) {
        if (s_adapters[nativeChainId_].adapter == address(0)) {
            revert IBridge.AdapterNotFound(nativeChainId_);
        }
        _;
    }

    /// ================== SETTINGS =========================
    /// @inheritdoc IBridge
    function setAdapter(uint256 nativeChainId_, uint256 abstractedChainId_, address adapter_) external restricted {
        s_adapters[nativeChainId_] = IBridge.AdapterSettings({
            abstractedChainId: abstractedChainId_,
            adapter: adapter_
        });

        emit IBridge.AdapterChanged(nativeChainId_, abstractedChainId_, adapter_);
    }

    /// @inheritdoc IBridge
    function adapters(uint256 nativeChainId_) public view returns (IBridge.AdapterSettings memory) {
        return s_adapters[nativeChainId_];
    }

    /// ================== OFFRAMP =========================
    /// @inheritdoc IBridge
    function transferToChain(
        uint256 toChain_,
        address receiver_,
        address token_,
        uint256 tokenId_
    ) external payable checkAdapter(toChain_) {
        address adapter = adapters(toChain_).adapter;

        bytes memory data = abi.encode(token_, tokenId_);
        IBridge.MessageSend memory payload = IBridge.MessageSend({toChain: toChain_, receiver: receiver_, data: data});

        uint256 quotedFees = IBaseAdapter(adapter).getFee(payload);
        if (quotedFees > msg.value) {
            revert IBridge.InsufficientFeeTokenAmount();
        }

        IERC721(token_).transferFrom(msg.sender, address(this), tokenId_);

        _transferToChain(adapter, payload);

        emit IBridge.TransferedToChain(toChain_, receiver_, token_, tokenId_);
    }

    /**
     * @notice send message to adapter
     * @param payload_ data to send to adapter
     */
    function _transferToChain(address adapter_, IBridge.MessageSend memory payload_) private {
        IBaseAdapter(adapter_).sendMessage(payload_);
        emit IBridge.MessageSent(payload_);
    }

    /// todo: isAllowedSender
    /// todo: isAllowedSourceChain
    /// todo: set wrapped asset or create wrapped on lock

    /// @inheritdoc IBridge
    /// @dev only adapter can call
    function receiveFromChain(IBridge.MessageReceive memory calldata_) external override restricted {
        /// todo: handle offramp message
        emit IBridge.MessageReceived(calldata_);
    }
}
