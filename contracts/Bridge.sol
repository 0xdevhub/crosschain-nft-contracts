// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IBaseAdapter} from "./interfaces/IBaseAdapter.sol";
import {IBridge} from "./interfaces/IBridge.sol";
import {IERC721, IERC721Metadata, IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {WERC721} from "./wrapped/WERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract Bridge is IBridge, AccessManaged {
    uint256 private immutable s_chainId;

    /// @dev evmChainId => rampType => evmChainIdSettings
    mapping(uint256 => mapping(IBridge.RampType => IBridge.EvmChainSettings)) private s_evmChainIdSettings;

    mapping(uint256 => uint256) private s_nonEvmChainIdToEvmChainId;

    /// @dev origin ERC721 address => wERC721
    mapping(address => IBridge.ERC721Wrapped) private s_WERC721ByOriginERC721Address;

    /// @dev wERC721 address => origin ERC721 address
    mapping(address => address) private s_originERC721AddressByWERC721Address;

    constructor(address accessManagement_, uint256 chainId_) AccessManaged(accessManagement_) {
        s_chainId = chainId_;
    }

    modifier checkEvmChainIdAdapterOnRamp(IBridge.EvmChainSettings memory evmChainSettings_) {
        if (evmChainSettings_.adapter == address(0)) {
            revert IBridge.AdapterNotFound();
        }
        _;
    }

    modifier checkEvmChainIdAdapterOffRamp(IBridge.EvmChainSettings memory evmChainSettings_, address sender_) {
        if (evmChainSettings_.adapter != sender_) {
            revert IBridge.AdapterNotFound();
        }
        _;
    }

    modifier checkEvmChainIdIsEnabled(IBridge.EvmChainSettings memory evmChainSettings_) {
        if (!evmChainSettings_.isEnabled) {
            revert IBridge.AdapterNotEnabled();
        }
        _;
    }

    /// @inheritdoc IBridge
    function chainId() public view returns (uint256) {
        return s_chainId;
    }

    /// @inheritdoc IBridge
    function setEvmChainIdSetting(
        uint256 evmChainId_,
        uint256 nonEvmChainId_,
        address adapter_,
        IBridge.RampType rampType_,
        bool isEnabled_,
        uint256 gasLimit_
    ) external restricted {
        IBridge.EvmChainSettings memory evmChainSettings = IBridge.EvmChainSettings({
            evmChainId: evmChainId_,
            nonEvmChainId: nonEvmChainId_,
            adapter: adapter_,
            isEnabled: isEnabled_,
            gasLimit: gasLimit_
        });

        s_evmChainIdSettings[evmChainId_][rampType_] = evmChainSettings;
        s_nonEvmChainIdToEvmChainId[nonEvmChainId_] = evmChainId_;

        emit IBridge.EvmChainSettingsSet(evmChainId_, rampType_);
    }

    /// @inheritdoc IBridge
    function getEvmChainIdSettings(
        uint256 evmChainId_,
        IBridge.RampType rampType_
    ) public view returns (IBridge.EvmChainSettings memory) {
        return s_evmChainIdSettings[evmChainId_][rampType_];
    }

    /// @inheritdoc IBridge
    function setWERC721ByOriginERC721Address(
        address originAddress_,
        uint256 evmChainId,
        address wrappedAddress_
    ) external restricted {
        __setWERC721ByOriginERC721(originAddress_, evmChainId, wrappedAddress_);
    }

    function __setWERC721ByOriginERC721(address originAddress_, uint256 evmChainId_, address wrappedAddress_) private {
        s_WERC721ByOriginERC721Address[originAddress_] = IBridge.ERC721Wrapped({
            evmChainId: evmChainId_,
            originAddress: originAddress_,
            wrappedAddress: wrappedAddress_
        });

        s_originERC721AddressByWERC721Address[wrappedAddress_] = originAddress_;

        emit IBridge.ERC721WrappedCreated(evmChainId_, originAddress_, wrappedAddress_);
    }

    /// @inheritdoc IBridge
    function getWERC721ByOriginERC721Address(
        address originAddress_
    ) public view returns (IBridge.ERC721Wrapped memory) {
        return s_WERC721ByOriginERC721Address[originAddress_];
    }

    /// @inheritdoc IBridge
    function sendERC721UsingERC20(
        uint256 evmChainId_,
        address ERC721Address_,
        uint256 tokenId_,
        uint256 quotedFee_
    )
        external
        checkEvmChainIdAdapterOnRamp(getEvmChainIdSettings(evmChainId_, IBridge.RampType.OnRamp))
        checkEvmChainIdIsEnabled(getEvmChainIdSettings(evmChainId_, IBridge.RampType.OnRamp))
    {
        IBaseAdapter adapter = IBaseAdapter(getEvmChainIdSettings(evmChainId_, IBridge.RampType.OnRamp).adapter);

        /// @dev check adapter support ERC20
        address feeToken = adapter.feeToken();
        if (feeToken == address(0)) revert IBridge.OperationNotSupported();

        /// @dev check ERC20 amount is same as quoted fee
        IBaseAdapter.MessageSend memory payload = _getPayload(evmChainId_, ERC721Address_, tokenId_);
        if (adapter.getFee(payload) > quotedFee_) revert IBridge.InsufficientFeeTokenAmount();

        /// @dev receive ERC721 and send message using ERC20
        IERC20(feeToken).transferFrom(msg.sender, address(this), quotedFee_);
        _receiveERC721FromSender(ERC721Address_, tokenId_);

        IERC20(feeToken).approve(address(adapter), quotedFee_);
        adapter.sendMessageUsingERC20(payload, quotedFee_);

        emit IBridge.ERC721Sent(evmChainId_, payload.receiver, payload.data);
    }

    /// @inheritdoc IBridge
    function sendERC721UsingNative(
        uint256 toChain_,
        address ERC721Address_,
        uint256 tokenId_
    )
        external
        payable
        checkEvmChainIdAdapterOnRamp(getEvmChainIdSettings(toChain_, IBridge.RampType.OnRamp))
        checkEvmChainIdIsEnabled(getEvmChainIdSettings(toChain_, IBridge.RampType.OnRamp))
    {
        /// @dev check adapter support native
        IBaseAdapter adapter = IBaseAdapter(getEvmChainIdSettings(toChain_, IBridge.RampType.OnRamp).adapter);
        if (adapter.feeToken() != address(0)) revert IBridge.OperationNotSupported();

        /// @dev check message value is same as quoted fee
        IBaseAdapter.MessageSend memory payload = _getPayload(toChain_, ERC721Address_, tokenId_);
        if (adapter.getFee(payload) > msg.value) revert IBridge.InsufficientFeeTokenAmount();

        /// @dev receive ERC721 and send message using native
        _receiveERC721FromSender(ERC721Address_, tokenId_);
        adapter.sendMessageUsingNative{value: msg.value}(payload);

        emit IBridge.ERC721Sent(toChain_, payload.receiver, payload.data);
    }

    function _receiveERC721FromSender(address ERC721Address_, uint256 tokenId_) private {
        /// @dev check if there is a wERC721 and burn
        address internalWERC721Address = getWERC721ByOriginERC721Address(
            s_originERC721AddressByWERC721Address[ERC721Address_]
        ).wrappedAddress;

        /// @dev check if it's a wERC721 to burn before send message
        if (internalWERC721Address != address(0)) {
            WERC721 wERC721 = WERC721(internalWERC721Address);

            wERC721.safeTransferFrom(msg.sender, address(this), tokenId_);
            wERC721.bridgeBurn(tokenId_);
        } else {
            IERC721(ERC721Address_).safeTransferFrom(msg.sender, address(this), tokenId_);
        }
    }

    function _getPayload(
        uint256 evmChainId_,
        address ERC721Address_,
        uint256 tokenId_
    ) internal view returns (IBaseAdapter.MessageSend memory) {
        EvmChainSettings memory offRampChainSettings = getEvmChainIdSettings(evmChainId_, IBridge.RampType.OffRamp);
        /// @dev check existent wERC721
        IBridge.ERC721Wrapped memory existentWERC721 = getWERC721ByOriginERC721Address(
            s_originERC721AddressByWERC721Address[ERC721Address_]
        );

        /// @dev if not wrapped, use the origin address
        address originTokenAddress = existentWERC721.originAddress == address(0)
            ? ERC721Address_
            : existentWERC721.originAddress;

        /// @dev if not wrapped, use the current chain id
        uint256 originChainId = existentWERC721.evmChainId == 0 ? s_chainId : existentWERC721.evmChainId;

        IERC721Metadata metadata = IERC721Metadata(ERC721Address_);

        return
            IBaseAdapter.MessageSend({
                gasLimit: offRampChainSettings.gasLimit,
                toChain: offRampChainSettings.nonEvmChainId, /// @dev adapter use nonvEvmChainId to handle message
                receiver: offRampChainSettings.adapter, /// @dev adatper address that will receive the message
                data: _getEncodedPayloadData(
                    msg.sender, /// @dev address that will receive the wERC721 in the other chain
                    abi.encode(originChainId, originTokenAddress, tokenId_),
                    abi.encode(metadata.name(), metadata.symbol(), metadata.tokenURI(tokenId_))
                )
            });
    }

    function _getEncodedPayloadData(
        address receiver_,
        bytes memory token_,
        bytes memory metadata_
    ) internal pure returns (bytes memory) {
        return abi.encode(receiver_, token_, metadata_);
    }

    /// @inheritdoc IBridge
    function receiveERC721(
        IBaseAdapter.MessageReceive memory payload_
    )
        external
        override
        restricted
        checkEvmChainIdAdapterOffRamp(
            getEvmChainIdSettings(s_nonEvmChainIdToEvmChainId[payload_.fromChain], IBridge.RampType.OffRamp),
            payload_.sender
        )
        checkEvmChainIdIsEnabled(
            getEvmChainIdSettings(s_nonEvmChainIdToEvmChainId[payload_.fromChain], IBridge.RampType.OffRamp)
        )
    {
        /// @dev check source chain id
        uint256 fromEvmChainId = s_nonEvmChainIdToEvmChainId[payload_.fromChain];

        IBridge.ERC721Data memory data = _getDecodedERC721Data(payload_.data);
        IBridge.ERC721Token memory token = _getDecodedERC721Token(data.token);

        address wERC721Address;

        address originERC721Address = token.tokenAddress;
        address receiverAddress = data.receiver;
        uint256 tokenId = token.tokenId;

        /// @dev check if token is from the current chain
        if (token.evmChainId == s_chainId) {
            wERC721Address = originERC721Address;

            IERC721(wERC721Address).transferFrom(address(this), receiverAddress, tokenId);
        } else {
            /// @dev get ERC21 metadata
            IBridge.ERC721Metadata memory metadata = _getDecodedERC721Metadata(data.metadata);
            address existentWERC721 = s_WERC721ByOriginERC721Address[originERC721Address].wrappedAddress;

            /// @dev check if theres an already wERC721 created, if not, create one
            if (existentWERC721 == address(0)) {
                wERC721Address = _createWERC721(token, metadata.name, metadata.symbol);
            } else {
                wERC721Address = existentWERC721;
            }

            WERC721(wERC721Address).bridgeMint(receiverAddress, tokenId, metadata.tokenURI);
        }

        emit IBridge.ERC721Received(fromEvmChainId, receiverAddress, payload_.data);
    }

    function _getDecodedERC721Data(bytes memory data_) internal pure returns (IBridge.ERC721Data memory) {
        (address receiver, bytes memory token, bytes memory metadata) = abi.decode(data_, (address, bytes, bytes));

        return IBridge.ERC721Data({receiver: receiver, token: token, metadata: metadata});
    }

    function _getDecodedERC721Token(bytes memory token_) internal pure returns (IBridge.ERC721Token memory) {
        (uint256 evmChainId, address tokenAddress, uint256 tokenId) = abi.decode(token_, (uint256, address, uint256));

        return IBridge.ERC721Token({evmChainId: evmChainId, tokenAddress: tokenAddress, tokenId: tokenId});
    }

    function _getDecodedERC721Metadata(bytes memory metadata_) internal pure returns (IBridge.ERC721Metadata memory) {
        (string memory name, string memory symbol, string memory tokenURI) = abi.decode(
            metadata_,
            (string, string, string)
        );

        return IBridge.ERC721Metadata({name: name, symbol: symbol, tokenURI: tokenURI});
    }

    function _createWERC721(
        IBridge.ERC721Token memory ERC721_,
        string memory name_,
        string memory symbol_
    ) private returns (address wERC721Address) {
        bytes32 salt = keccak256(abi.encodePacked(ERC721_.evmChainId, ERC721_.tokenAddress));

        wERC721Address = address(new WERC721{salt: salt}(name_, symbol_));

        if (wERC721Address == address(0)) revert IBridge.ERC721WrappedCreationFailed();

        __setWERC721ByOriginERC721(ERC721_.tokenAddress, ERC721_.evmChainId, wERC721Address);
    }

    /// @inheritdoc IBridge
    function onERC721Received(address operator, address, uint256, bytes calldata) external view returns (bytes4) {
        if (operator != address(this)) revert IBridge.TransferNotAllowed();
        return type(IERC721Receiver).interfaceId;
    }
}
