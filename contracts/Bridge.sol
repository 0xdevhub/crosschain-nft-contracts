// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IBaseAdapter} from "./interfaces/IBaseAdapter.sol";
import {IBridge} from "./interfaces/IBridge.sol";
import {IERC721, IERC721Metadata, IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "hardhat/console.sol";

contract Bridge is IBridge, AccessManaged {
    uint256 private immutable s_chainId;

    /// @dev evmChainId -> settings
    mapping(uint256 => IBridge.ChainSettings) public s_evmChainSettings;

    /// @dev nonEvmChainId -> evmChainId
    mapping(uint256 => uint256) public s_nonEvmChains;

    /**
     * @notice Bridge contract constructor
     * @param accessManagement_ address of the AccessManagement contract
     * @param chainId_ chain id of the current chain
     */
    constructor(address accessManagement_, uint256 chainId_) AccessManaged(accessManagement_) {
        s_chainId = chainId_;
    }

    /**
     * @notice Modifier to check if the adapter is valid also
     *         if the sender is the adapter when the ramp type is off ramp
     * @param evmChainId_ evm chain id to get chain settings
     * @param rampType_ ramp type to check if it requires the sender to be the adapter
     */
    modifier checkEvmChainAdapterIsValid(uint256 evmChainId_, RampType rampType_) {
        IBridge.ChainSettings memory chainSettings = s_evmChainSettings[evmChainId_];
        bool mustCheckSenderIsAdapter = rampType_ == IBridge.RampType.OffRamp;

        if (chainSettings.adapter == address(0) || (mustCheckSenderIsAdapter && msg.sender != chainSettings.adapter)) {
            revert IBridge.AdapterNotFound(evmChainId_);
        }
        _;
    }

    /**
     * @notice Modifier to check if the evm chain id is enabled/disabled
     * @param evmChainId_ evm chain id to get chain settings
     */
    modifier checkEvmChainIdIsEnabled(uint256 evmChainId_) {
        if (!s_evmChainSettings[evmChainId_].isEnabled) {
            revert IBridge.AdapterNotEnabled(evmChainId_);
        }
        _;
    }

    /**
     * @notice Modifier to check if the evm chain id ramp type is the same as the one provided
     * @param evmChainId_ evm chain id to get chain settings
     * @param rampType_ ramp type to check be checked
     */
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
        _setNonEvmChainIdByEvmChainId(nonEvmChainId_, evmChainId_);

        emit IBridge.ChainSettingsSet(evmChainId_, nonEvmChainId_, adapter_);
    }

    /**
     * @notice Set non evm chain id by evm chain id
     * @param nonEvmChainId_ non evm chain id to be used as map key
     */
    function _setNonEvmChainIdByEvmChainId(uint256 nonEvmChainId_, uint256 evmChainId_) private {
        s_nonEvmChains[nonEvmChainId_] = evmChainId_;
    }

    /// @inheritdoc IBridge
    function getChainSettings(uint256 evmChainId_) public view returns (IBridge.ChainSettings memory) {
        return s_evmChainSettings[evmChainId_];
    }

    /// @inheritdoc IBridge
    function bridgeERC721(
        uint256 toChain_,
        address receiver_,
        address token_,
        uint256 tokenId_
    )
        external
        payable
        checkEvmChainAdapterIsValid(toChain_, IBridge.RampType.OnRamp)
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

    /**
     * @notice Receive ERC721 token
     * @param token_ contract address to get IERC721 interface
     * @param tokenId_ token id to be received
     */
    function _receiveERC721(address token_, uint256 tokenId_) private {
        IERC721(token_).safeTransferFrom(msg.sender, address(this), tokenId_);
    }

    /**
     * @notice Get payload to be sent to the adapter on the other chain via crosschain message
     * @param nonEvmChainId_ non evm chain id to send the message
     * @param token_ token address to be sent
     * @param tokenId_ token id to be sent to receiver
     * @param receiver_ the address of receiver in the other chain
     */
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

    /// @dev encode token details to reuse it in the other chain
    function _getEncodedPayloadData(
        address token_,
        uint256 tokenId_,
        string memory name_,
        string memory symbol_,
        string memory tokenURI_
    ) internal pure returns (bytes memory) {
        return abi.encode(token_, tokenId_, name_, symbol_, tokenURI_);
    }

    /// @dev send message to other chain  through the adapter
    function _commitOnRamp(IBaseAdapter adapter_, IBridge.MessageSend memory payload_) private {
        adapter_.sendMessage(payload_);
    }

    /// @inheritdoc IBridge
    function commitOffRamp(
        IBridge.MessageReceive memory payload_
    )
        external
        override
        checkEvmChainAdapterIsValid(s_nonEvmChains[payload_.fromChain], IBridge.RampType.OffRamp)
        checkEvmChainIdIsEnabled(s_nonEvmChains[payload_.fromChain])
        checkEvmChainByRampType(s_nonEvmChains[payload_.fromChain], IBridge.RampType.OffRamp)
        restricted
    {
        /// todo: check if the incoming chain is same as the contract itself
        /// todo: check if chain id is same as the one in the payload then transfer to receiver, since it is locked here
        /// ELSE
        /// todo: check if theres one wrapped already created or create wrapped ERC721 token
        /// todo: mint the token id to the receiver

        emit IBridge.MessageReceived(payload_.fromChain, payload_.sender, payload_.data);
    }

    /// @inheritdoc IBridge
    function onERC721Received(address operator, address, uint256, bytes calldata) external view returns (bytes4) {
        if (operator != address(this)) revert IBridge.TransferNotAllowed();
        return type(IERC721Receiver).interfaceId;
    }
}
