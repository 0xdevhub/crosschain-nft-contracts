// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IBaseAdapter} from "./interfaces/IBaseAdapter.sol";
import {IBridge} from "./interfaces/IBridge.sol";
import {IERC721, IERC721Metadata, IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {WERC721} from "./wrapped/WERC721.sol";

import "hardhat/console.sol";

contract Bridge is IBridge, AccessManaged {
    uint256 private immutable s_chainId;

    /// @dev evmChainId -> settings
    mapping(uint256 => IBridge.ChainSettings) public s_evmChainSettings;

    /// @dev nonEvmChainId -> evmChainId
    mapping(uint256 => uint256) public s_nonEvmChains;

    mapping(address => WrappedERC721) public s_wrappedTokens;

    constructor(address accessManagement_, uint256 chainId_) AccessManaged(accessManagement_) {
        s_chainId = chainId_;
    }

    modifier checkEvmChainIdAdapterIsValid(uint256 evmChainId_) {
        IBridge.ChainSettings memory chainSettings = s_evmChainSettings[evmChainId_];

        if (chainSettings.adapter == address(0)) {
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

    modifier checkEvmChainIdByRampType(uint256 evmChainId_, IBridge.RampType rampType_) {
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

    function _setNonEvmChainIdByEvmChainId(uint256 nonEvmChainId_, uint256 evmChainId_) private {
        s_nonEvmChains[nonEvmChainId_] = evmChainId_;
    }

    /// @inheritdoc IBridge
    function getChainSettings(uint256 evmChainId_) public view returns (IBridge.ChainSettings memory) {
        return s_evmChainSettings[evmChainId_];
    }

    /// @inheritdoc IBridge
    function sendERC721(
        uint256 toChain_,
        address receiver_,
        address token_,
        uint256 tokenId_
    )
        external
        payable
        checkEvmChainIdAdapterIsValid(toChain_)
        checkEvmChainIdIsEnabled(toChain_)
        checkEvmChainIdByRampType(toChain_, IBridge.RampType.OnRamp)
    {
        ChainSettings memory chainSettings = getChainSettings(toChain_);

        IBridge.MessageSend memory payload = _getPayload(chainSettings.nonEvmChainId, token_, tokenId_, receiver_);

        IBaseAdapter adapter = IBaseAdapter(chainSettings.adapter);

        if (adapter.getFee(payload) > msg.value) revert IBridge.InsufficientFeeTokenAmount();

        /// @todo: check if its wrapped, then burn instead of transfer
        IERC721(token_).safeTransferFrom(msg.sender, address(this), tokenId_);

        adapter.sendMessage(payload);

        emit IBridge.MessageSent(payload.toChain, payload.receiver, payload.data);
    }

    function _getPayload(
        uint256 nonEvmChainId_,
        address token_,
        uint256 tokenId_,
        address receiver_
    ) internal view returns (IBridge.MessageSend memory) {
        IERC721Metadata tokenMetadata = IERC721Metadata(token_);

        return
            IBridge.MessageSend({
                toChain: nonEvmChainId_,
                receiver: receiver_,
                data: _getEncodedPayloadData(
                    token_,
                    tokenId_,
                    tokenMetadata.name(),
                    tokenMetadata.symbol(),
                    tokenMetadata.tokenURI(tokenId_)
                )
            });
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

    /// @inheritdoc IBridge
    function receiveERC721(
        IBridge.MessageReceive memory payload_
    )
        external
        override
        restricted
        checkEvmChainIdAdapterIsValid(s_nonEvmChains[payload_.fromChain])
        checkEvmChainIdIsEnabled(s_nonEvmChains[payload_.fromChain])
        checkEvmChainIdByRampType(s_nonEvmChains[payload_.fromChain], IBridge.RampType.OffRamp)
    {
        /// todo: check if the incoming chain is same as the contract itself
        /// todo: check if chain id is same as the one in the payload then transfer to receiver, since it is locked here
        /// ELSE
        /// todo: check if theres one wrapped already created or create wrapped ERC721 token
        /// todo: mint the token id to the receiver

        emit IBridge.MessageReceived(payload_.fromChain, payload_.sender, payload_.data);

        IBridge.MessageData memory messageData = _getDecodedPayloadData(payload_.data);

        bytes memory constructorArgs = abi.encode(messageData.name, messageData.symbol);
        bytes memory bytecode = abi.encodePacked(type(WERC721).creationCode, constructorArgs);
        bytes32 salt = keccak256(abi.encodePacked(payload_.fromChain, messageData.token));

        address wrappedToken;

        assembly {
            wrappedToken := create2(0, add(bytecode, 0x20), mload(bytecode), salt)

            if iszero(extcodesize(wrappedToken)) {
                revert(0, 0)
            }
        }

        _setWrappedToken(wrappedToken, payload_.fromChain, messageData.token);

        WERC721(wrappedToken).safeMint(payload_.sender, messageData.tokenId, messageData.tokenURI);

        emit IBridge.WrappedCreated(payload_.fromChain, messageData.token, wrappedToken);
    }

    function _getDecodedPayloadData(bytes memory data_) internal pure returns (IBridge.MessageData memory) {
        (address token, uint256 tokenId, string memory name, string memory symbol, string memory tokenURI) = abi.decode(
            data_,
            (address, uint256, string, string, string)
        );

        return IBridge.MessageData({token: token, tokenId: tokenId, name: name, symbol: symbol, tokenURI: tokenURI});
    }

    function _setWrappedToken(address token_, uint256 originChainId_, address originAddress_) private {
        s_wrappedTokens[token_] = WrappedERC721({originChainId: originChainId_, originAddress: originAddress_});
    }

    /// @inheritdoc IBridge
    function onERC721Received(address operator, address, uint256, bytes calldata) external view returns (bytes4) {
        if (operator != address(this)) revert IBridge.TransferNotAllowed();
        return type(IERC721Receiver).interfaceId;
    }
}
