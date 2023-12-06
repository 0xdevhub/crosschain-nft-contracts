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

    /// @dev evmChainId => rampType => evmChainSettings
    mapping(uint256 => mapping(IBridge.RampType => IBridge.EvmChainSettings)) private s_evmChainSettings;

    /// @dev nonEvmChainId => evmChainId
    mapping(uint256 => uint256) private s_nonEvmChains;

    /// @dev originAddress -> wrapped token
    mapping(address => IBridge.ERC721Wrapped) private s_wrappedERC721Tokens;

    /// @dev wrapped token address -> origin address
    mapping(address => address) private s_wrappedERC721TokenOrigin;

    constructor(address accessManagement_, uint256 chainId_) AccessManaged(accessManagement_) {
        s_chainId = chainId_;
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
        bool isEnabled_,
        uint256 gasLimit_
    ) external {
        IBridge.EvmChainSettings memory evmChainSettings = IBridge.EvmChainSettings({
            evmChainId: evmChainId_,
            nonEvmChainId: nonEvmChainId_,
            adapter: adapter_,
            isEnabled: isEnabled_,
            gasLimit: gasLimit_
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
    function setERC721WrappedToken(
        address wrappedAddress_,
        uint256 originEvmChainId_,
        address originAddress_
    ) external {
        _setERC721WrappedToken(wrappedAddress_, originEvmChainId_, originAddress_);
    }

    function _setERC721WrappedToken(
        address wrappedAddress_,
        uint256 originEvmChainId_,
        address originAddress_
    ) private {
        s_wrappedERC721Tokens[originAddress_] = IBridge.ERC721Wrapped({
            originEvmChainId: originEvmChainId_,
            originAddress: originAddress_,
            wrappedAddress: wrappedAddress_
        });

        s_wrappedERC721TokenOrigin[wrappedAddress_] = originAddress_;

        emit IBridge.ERC721WrappedCreated(originEvmChainId_, originAddress_, wrappedAddress_);
    }

    /// @inheritdoc IBridge
    function sendERC721UsingERC20(uint256 toChain_, address token_, uint256 tokenId_, uint256 amount_) external {
        IBaseAdapter adapter = IBaseAdapter(getChainSettings(toChain_, IBridge.RampType.OnRamp).adapter);

        address feeToken = adapter.feeToken();
        if (feeToken == address(0)) revert IBridge.OperationNotSupported();

        IBridge.ERC721Send memory payload = _getPayload(toChain_, token_, tokenId_);
        if (adapter.getFee(payload) > amount_) revert IBridge.InsufficientFeeTokenAmount();

        /// @dev get fees tokens first
        IERC20(feeToken).transferFrom(msg.sender, address(this), amount_);

        _receiveERC721FromSender(token_, tokenId_);

        /// @dev approve adapter to spend fees tokens
        IERC20(feeToken).approve(address(adapter), amount_);

        adapter.sendMessageUsingERC20(payload, amount_);

        emit IBridge.ERC721Sent(toChain_, payload.receiver, payload.data);
    }

    function _receiveERC721FromSender(address token_, uint256 tokenId_) private {
        /// @dev check if its wrapped, then burn instead of transfer
        address existentWrappedAddress = s_wrappedERC721Tokens[s_wrappedERC721TokenOrigin[token_]].wrappedAddress;

        if (existentWrappedAddress != address(0)) {
            WERC721 wERC721 = WERC721(existentWrappedAddress);
            wERC721.safeTransferFrom(msg.sender, address(this), tokenId_);
            wERC721.bridgeBurn(tokenId_);
        } else {
            IERC721(token_).safeTransferFrom(msg.sender, address(this), tokenId_);
        }
    }

    /// @inheritdoc IBridge
    function sendERC721UsingNative(uint256 toChain_, address token_, uint256 tokenId_) external payable {
        IBaseAdapter adapter = IBaseAdapter(getChainSettings(toChain_, IBridge.RampType.OnRamp).adapter);
        if (adapter.feeToken() != address(0)) revert IBridge.OperationNotSupported();

        IBridge.ERC721Send memory payload = _getPayload(toChain_, token_, tokenId_);
        if (adapter.getFee(payload) > msg.value) revert IBridge.InsufficientFeeTokenAmount();

        _receiveERC721FromSender(token_, tokenId_);

        adapter.sendMessageUsingNative{value: msg.value}(payload);

        emit IBridge.ERC721Sent(toChain_, payload.receiver, payload.data);
    }

    function _getPayload(
        uint256 evmChainId_,
        address token_,
        uint256 tokenId_
    ) internal view returns (IBridge.ERC721Send memory) {
        /// @dev get target details to prepare payload
        EvmChainSettings memory offRampChainSettings = getChainSettings(evmChainId_, IBridge.RampType.OffRamp);
        IERC721Metadata metadata = IERC721Metadata(token_);

        return
            IBridge.ERC721Send({
                gasLimit: offRampChainSettings.gasLimit,
                toChain: offRampChainSettings.nonEvmChainId, /// @dev adapter use nonvEvmChainId to handle message
                receiver: offRampChainSettings.adapter, /// @dev adatper address that will receive the message
                data: _getEncodedPayloadData(
                    msg.sender, /// @dev address that will receive the ERC721 wrapped in the other chain
                    abi.encode(s_chainId, token_, tokenId_),
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
    function receiveERC721(IBridge.ERC721Receive memory payload_) external override {
        uint256 fromEvmChainId = s_nonEvmChains[payload_.fromChain];

        IBridge.ERC721Data memory data = _getDecodedERC721Data(payload_.data);
        IBridge.ERC721Token memory token = _getDecodedERC721Token(data.token);

        address wrappedERC721Token;
        address originTokenAddress = token.tokenAddress;
        address receiver = data.receiver;
        uint256 tokenId = token.tokenId;

        if (token.evmChainId == s_chainId) {
            /// @dev unlock and transfer to receiver
            wrappedERC721Token = originTokenAddress;
            IERC721(wrappedERC721Token).transferFrom(address(this), receiver, tokenId);
        } else {
            IBridge.ERC721Metadata memory metadata = _getDecodedERC721Metadata(data.metadata);
            address wrappedERC721Token_ = s_wrappedERC721Tokens[originTokenAddress].wrappedAddress;

            if (wrappedERC721Token_ == address(0)) {
                /// @dev create new ERC721
                wrappedERC721Token = _createWrapped(payload_, originTokenAddress, metadata.name, metadata.symbol);
            } else {
                /// @dev reuse an already wrapped ERC721
                wrappedERC721Token = wrappedERC721Token_;
            }

            WERC721(wrappedERC721Token).bridgeMint(receiver, tokenId, metadata.tokenURI);
        }

        emit IBridge.ERC721Received(fromEvmChainId, receiver, payload_.data);
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

    // ["14767482510784806043","0xf783c882dc9A0AB1E59301AEE0b742bb4582Dd8C","0x0000000000000000000000006815547453b8731a39eb420c11e45d6c685a677c000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000001388100000000000000000000000075df84936cc7fc772f68e66269aac03d1bbf8e5f00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000568656c6c6f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005776f726c640000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"]
    function _createWrapped(
        IBridge.ERC721Receive memory payload_,
        address token,
        string memory name_,
        string memory symbol_
    ) private returns (address wrappedERC721Token) {
        bytes memory constructorArgs = abi.encode(address(this), name_, symbol_);
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

    /// @inheritdoc IBridge
    function onERC721Received(address operator, address, uint256, bytes calldata) external view returns (bytes4) {
        if (operator != address(this)) revert IBridge.TransferNotAllowed();
        return type(IERC721Receiver).interfaceId;
    }
}
