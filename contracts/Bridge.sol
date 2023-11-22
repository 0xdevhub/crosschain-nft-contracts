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
    // mapping(uint256 => IBridge.EvmChainSettings) private s_evmChainSettings;
    /// @dev rampType -> nonEvemChainId -> evmChainSettings
    // mapping(IBridge.RampType => mapping(uint256 => EvmChainSettings)) private s_nonEvmChainsSettings;
    /// @dev rampType -> evmChainId -> evmChainSettings
    // mapping(IBridge.RampType => mapping(uint256 => EvmChainSettings)) private s_evmChainsSettings;

    /// @dev evmChainId => rampType => evmChainSettings
    mapping(uint256 => mapping(IBridge.RampType => IBridge.EvmChainSettings)) private s_evmChainSettings;

    /// @dev nonEvmChainId => evmChainId
    mapping(uint256 => uint256) private s_nonEvmChains;

    mapping(address => ERC721Wrapped) private s_wrappedERC721Tokens;

    constructor(address accessManagement_, uint256 chainId_) AccessManaged(accessManagement_) {
        s_chainId = chainId_;
    }

    modifier checkEvmChainIdAdapterIsValid(IBridge.EvmChainSettings memory evmChainSettings_) {
        if (evmChainSettings_.adapter == address(0)) {
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
    function setChainSetting(
        uint256 evmChainId_,
        uint256 nonEvmChainId_,
        address adapter_,
        IBridge.RampType rampType_,
        bool isEnabled_
    ) external restricted {
        IBridge.EvmChainSettings memory evmChainSettings = IBridge.EvmChainSettings({
            evmChainId: evmChainId_,
            nonEvmChainId: nonEvmChainId_,
            adapter: adapter_,
            isEnabled: isEnabled_
        });

        s_evmChainSettings[evmChainId_][rampType_] = evmChainSettings;
        s_nonEvmChains[nonEvmChainId_] = evmChainId_;

        emit IBridge.EvmChainSettingsSet(evmChainId_, rampType_);
    }

    /// @inheritdoc IBridge
    function getChainSettings(
        uint256 evmChainId_,
        IBridge.RampType rampType_
    ) public view returns (IBridge.EvmChainSettings memory) {
        return s_evmChainSettings[evmChainId_][rampType_];
    }

    /// @inheritdoc IBridge
    function sendERC721(
        uint256 toChain_,
        address token_,
        uint256 tokenId_
    )
        external
        payable
        checkEvmChainIdAdapterIsValid(s_evmChainSettings[toChain_][IBridge.RampType.OnRamp])
        checkEvmChainIdIsEnabled(s_evmChainSettings[toChain_][IBridge.RampType.OnRamp])
    {
        IBridge.ERC721Send memory payload = _getPayload(toChain_, token_, tokenId_);

        IBaseAdapter adapter = IBaseAdapter(payload.receiver);
        if (adapter.getFee(payload) > msg.value) revert IBridge.InsufficientFeeTokenAmount();

        /// @todo: check if its wrapped, then burn instead of transfer
        IERC721(token_).safeTransferFrom(msg.sender, address(this), tokenId_);

        adapter.sendMessage(payload);

        emit IBridge.ERC721Sent(toChain_, payload.receiver, payload.data);
    }

    function _getPayload(
        uint256 evmChainId_,
        address token_,
        uint256 tokenId_
    ) internal view returns (IBridge.ERC721Send memory) {
        EvmChainSettings memory chainSettings = getChainSettings(evmChainId_, IBridge.RampType.OnRamp);
        IERC721Metadata metadata = IERC721Metadata(token_);

        return
            IBridge.ERC721Send({
                toChain: chainSettings.nonEvmChainId, /// @dev adapter use nonvEvmChainId to handle message
                receiver: chainSettings.adapter, /// @dev adatper address that will receive the message
                data: _getEncodedPayloadData(
                    msg.sender, /// @dev address that will receive the ERC721 wrapped in the other chain
                    abi.encode(evmChainId_, token_, tokenId_),
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
        IBridge.ERC721Receive memory payload_
    )
        external
        override
        restricted
        checkEvmChainIdAdapterIsValid(s_evmChainSettings[s_nonEvmChains[payload_.fromChain]][IBridge.RampType.OffRamp])
        checkEvmChainIdIsEnabled(s_evmChainSettings[s_nonEvmChains[payload_.fromChain]][IBridge.RampType.OffRamp])
    {
        uint256 evmChainId = s_nonEvmChains[payload_.fromChain];

        IBridge.ERC721Data memory data = _getDecodedERC721Data(payload_.data);

        emit IBridge.ERC721Received(evmChainId, payload_.sender, payload_.data);

        IBridge.ERC721Token memory token = _getDecodedERC721Token(data.token);

        address wrappedERC721Token;

        if (token.evmChainId == s_chainId) {
            wrappedERC721Token = token.token;
            IERC721(token.token).safeTransferFrom(address(this), payload_.sender, token.tokenId);
        } else {
            /// @todo: check if wrapped token exists, if not create it
            IBridge.ERC721Metadata memory metadata = _getDecodedERC721Metadata(data.metadata);
            wrappedERC721Token = _createWrapped(payload_, token.token, metadata.name, metadata.symbol);
            WERC721(wrappedERC721Token).safeMint(data.receiver, token.tokenId, metadata.tokenURI);
        }

        emit IBridge.ERC721WrappedCreated(evmChainId, token.token, wrappedERC721Token);
    }

    function _getDecodedERC721Data(bytes memory data_) internal pure returns (IBridge.ERC721Data memory) {
        (address receiver, bytes memory token, bytes memory metadata) = abi.decode(data_, (address, bytes, bytes));

        return IBridge.ERC721Data({receiver: receiver, token: token, metadata: metadata});
    }

    function _getDecodedERC721Token(bytes memory token_) internal pure returns (ERC721Token memory) {
        (uint256 evmChainId, address token, uint256 tokenId) = abi.decode(token_, (uint256, address, uint256));

        return ERC721Token({evmChainId: evmChainId, token: token, tokenId: tokenId});
    }

    function _getDecodedERC721Metadata(bytes memory metadata_) internal pure returns (IBridge.ERC721Metadata memory) {
        (string memory name, string memory symbol, string memory tokenURI) = abi.decode(
            metadata_,
            (string, string, string)
        );

        return IBridge.ERC721Metadata({name: name, symbol: symbol, tokenURI: tokenURI});
    }

    function _createWrapped(
        IBridge.ERC721Receive memory payload_,
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

        _setERC721WrappedToken(wrappedERC721Token, s_nonEvmChains[payload_.fromChain], token);
    }

    // function setERC721WrappedToken(address token_, uint256 originEvmChainId, address originAddress_) external restricted {
    //     _setERC721WrappedToken(token_, originEvmChainId, originAddress_);
    // }

    function _setERC721WrappedToken(address token_, uint256 originEvmChainId, address originAddress_) private {
        s_wrappedERC721Tokens[token_] = ERC721Wrapped({
            originEvmChainId: originEvmChainId,
            originAddress: originAddress_
        });
    }

    /// @inheritdoc IBridge
    function onERC721Received(address operator, address, uint256, bytes calldata) external view returns (bytes4) {
        if (operator != address(this)) revert IBridge.TransferNotAllowed();
        return type(IERC721Receiver).interfaceId;
    }
}
