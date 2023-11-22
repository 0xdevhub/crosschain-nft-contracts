// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IBaseAdapter} from "./interfaces/IBaseAdapter.sol";
import {IBridge} from "./interfaces/IBridge.sol";
import {IERC721, IERC721Metadata, IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {WERC721} from "./wrapped/WERC721.sol";

contract Bridge is IBridge, AccessManaged {
    uint256 private immutable s_chainId;

    /// @dev evmChainId -> settings
    mapping(uint256 => IBridge.ChainSettings) public s_evmChainSettings;

    /// @dev nonEvmChainId -> evmChainId
    mapping(uint256 => uint256) public s_nonEvmChains;

    mapping(address => WrappedERC721) public s_wrappedERC721Tokens;

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
        IERC721Metadata metadata = IERC721Metadata(token_);

        return
            IBridge.MessageSend({
                toChain: nonEvmChainId_,
                receiver: receiver_,
                data: _getEncodedPayloadData(
                    s_nonEvmChains[nonEvmChainId_],
                    token_,
                    tokenId_,
                    abi.encode(metadata.name(), metadata.symbol(), metadata.tokenURI(tokenId_))
                )
            });
    }

    function _getEncodedPayloadData(
        uint256 evmChainId,
        address token_,
        uint256 tokenId_,
        bytes memory metadata
    ) internal pure returns (bytes memory) {
        return abi.encode(evmChainId, token_, tokenId_, metadata);
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
        emit IBridge.MessageReceived(s_nonEvmChains[payload_.fromChain], payload_.sender, payload_.data);

        IBridge.MessageData memory data = _getDecodedPayloadData(payload_.data);

        IBridge.Metadata memory metadata = _getDecodedMetadata(data.metadata);

        address wrappedERC721Token = _createWrapped(payload_, data.token, metadata.name, metadata.symbol);

        WERC721(wrappedERC721Token).safeMint(payload_.sender, data.tokenId, metadata.tokenURI);

        emit IBridge.WrappedCreated(s_nonEvmChains[payload_.fromChain], data.token, wrappedERC721Token);
    }

    function _getDecodedPayloadData(bytes memory data_) internal pure returns (IBridge.MessageData memory) {
        (uint256 evmChainId, address token, uint256 tokenId, bytes memory metadata) = abi.decode(
            data_,
            (uint256, address, uint256, bytes)
        );

        return IBridge.MessageData({evmChainId: evmChainId, token: token, tokenId: tokenId, metadata: metadata});
    }

    function _getDecodedMetadata(bytes memory data_) internal pure returns (IBridge.Metadata memory) {
        (string memory name, string memory symbol, string memory tokenURI) = abi.decode(
            data_,
            (string, string, string)
        );

        return IBridge.Metadata({name: name, symbol: symbol, tokenURI: tokenURI});
    }

    function _createWrapped(
        IBridge.MessageReceive memory payload_,
        address token,
        string memory name,
        string memory symbol
    ) private returns (address wrappedERC721Token) {
        bytes memory constructorArgs = abi.encode(name, symbol);
        bytes memory bytecode = abi.encodePacked(type(WERC721).creationCode, constructorArgs);
        bytes32 salt = keccak256(abi.encodePacked(s_nonEvmChains[payload_.fromChain], token));

        assembly {
            wrappedERC721Token := create2(0, add(bytecode, 0x20), mload(bytecode), salt)

            if iszero(extcodesize(wrappedERC721Token)) {
                revert(0, 0)
            }
        }

        _setWrappedERC721Token(wrappedERC721Token, s_nonEvmChains[payload_.fromChain], token);
    }

    function _setWrappedERC721Token(address token_, uint256 originChainId_, address originAddress_) private {
        s_wrappedERC721Tokens[token_] = WrappedERC721({originChainId: originChainId_, originAddress: originAddress_});
    }

    /// @inheritdoc IBridge
    function onERC721Received(address operator, address, uint256, bytes calldata) external view returns (bytes4) {
        if (operator != address(this)) revert IBridge.TransferNotAllowed();
        return type(IERC721Receiver).interfaceId;
    }
}
