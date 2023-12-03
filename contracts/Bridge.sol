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

    // mapping(uint256 => IBridge.ERC721Receive) public receivedERC721;
    // uint256 public receivedERC721Count;

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

    /// @dev test
    // function setERC721WrappedToken(
    //     address wrappedAddress_,
    //     uint256 originEvmChainId,
    //     address originAddress
    // ) external restricted {
    //     _setERC721WrappedToken(wrappedAddress_, originEvmChainId, originAddress);
    // }

    function _setERC721WrappedToken(address wrappedAddress_, uint256 originEvmChainId, address originAddress) private {
        s_wrappedERC721Tokens[originAddress] = IBridge.ERC721Wrapped({
            originEvmChainId: originEvmChainId,
            originAddress: originAddress,
            wrappedAddress: wrappedAddress_
        });

        s_wrappedERC721TokenOrigin[wrappedAddress_] = originAddress;
    }

    /// @inheritdoc IBridge
    function sendERC721UsingERC20(
        uint256 toChain_,
        address token_,
        uint256 tokenId_,
        uint256 amount_
    )
        external
        checkEvmChainIdAdapterIsValid(getChainSettings(toChain_, IBridge.RampType.OnRamp))
        checkEvmChainIdIsEnabled(getChainSettings(toChain_, IBridge.RampType.OnRamp))
    {
        IBaseAdapter adapter = IBaseAdapter(getChainSettings(toChain_, IBridge.RampType.OnRamp).adapter);
        if (adapter.feeToken() == address(0)) revert IBridge.OperationNotSupported();

        IBridge.ERC721Send memory payload = _getPayload(toChain_, token_, tokenId_);
        if (adapter.getFee(payload) > amount_) revert IBridge.InsufficientFeeTokenAmount();

        /// @dev get fees tokens first
        IERC20(adapter.feeToken()).transferFrom(msg.sender, address(this), amount_);

        /// @dev check if its wrapped, then burn instead of transfer
        address incomeWrappedTokenAddress = s_wrappedERC721Tokens[s_wrappedERC721TokenOrigin[token_]].wrappedAddress;

        if (incomeWrappedTokenAddress != address(0)) {
            WERC721(incomeWrappedTokenAddress).safeTransferFrom(msg.sender, address(this), tokenId_);
            WERC721(incomeWrappedTokenAddress).burn(tokenId_);
        } else {
            IERC721(token_).safeTransferFrom(msg.sender, address(this), tokenId_);
        }

        /// @dev approve adapter to spend fees tokens
        IERC20(adapter.feeToken()).approve(address(adapter), amount_);

        adapter.sendMessageUsingERC20(payload, amount_);

        emit IBridge.ERC721Sent(toChain_, payload.receiver, payload.data);
    }

    /// @inheritdoc IBridge
    function sendERC721UsingNative(
        uint256 toChain_,
        address token_,
        uint256 tokenId_
    )
        external
        payable
        checkEvmChainIdAdapterIsValid(getChainSettings(toChain_, IBridge.RampType.OnRamp))
        checkEvmChainIdIsEnabled(getChainSettings(toChain_, IBridge.RampType.OnRamp))
    {
        IBaseAdapter adapter = IBaseAdapter(getChainSettings(toChain_, IBridge.RampType.OnRamp).adapter);
        if (adapter.feeToken() != address(0)) revert IBridge.OperationNotSupported();

        IBridge.ERC721Send memory payload = _getPayload(toChain_, token_, tokenId_);
        if (adapter.getFee(payload) > msg.value) revert IBridge.InsufficientFeeTokenAmount();

        /// @dev check if its wrapped, then burn instead of transfer
        address incomeWrappedTokenAddress = s_wrappedERC721Tokens[s_wrappedERC721TokenOrigin[token_]].wrappedAddress;

        if (incomeWrappedTokenAddress != address(0)) {
            WERC721(incomeWrappedTokenAddress).safeTransferFrom(msg.sender, address(this), tokenId_);
            WERC721(incomeWrappedTokenAddress).burn(tokenId_);
        } else {
            /// @dev transfer to bridge contract to lock
            IERC721(token_).safeTransferFrom(msg.sender, address(this), tokenId_);
        }

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

    /// @dev todo: split this operation to handle by automation instead
    /// @inheritdoc IBridge
    function receiveERC721(
        IBridge.ERC721Receive memory payload_
    )
        external
        override
        restricted
        checkEvmChainIdAdapterIsValid(getChainSettings(s_nonEvmChains[payload_.fromChain], IBridge.RampType.OffRamp))
        checkEvmChainIdIsEnabled(getChainSettings(s_nonEvmChains[payload_.fromChain], IBridge.RampType.OffRamp))
    {
        // receivedERC721[receivedERC721Count++] = payload_;

        uint256 evmChainId = s_nonEvmChains[payload_.fromChain];
        address wrappedERC721Token;

        IBridge.ERC721Data memory data = _getDecodedERC721Data(payload_.data);
        IBridge.ERC721Token memory token = _getDecodedERC721Token(data.token);

        if (token.evmChainId == s_chainId) {
            /// @dev unlock and transfer to receiver
            wrappedERC721Token = token.tokenAddress;
            IERC721(wrappedERC721Token).safeTransferFrom(address(this), data.receiver, token.tokenId);
        } else {
            IBridge.ERC721Metadata memory metadata = _getDecodedERC721Metadata(data.metadata);
            address wrappedERC721Token_ = s_wrappedERC721Tokens[token.tokenAddress].wrappedAddress;

            if (wrappedERC721Token_ == address(0)) {
                /// @dev create new ERC721
                wrappedERC721Token = _createWrapped(payload_, token.tokenAddress, metadata.name, metadata.symbol);
                _setERC721WrappedToken(wrappedERC721Token, s_nonEvmChains[payload_.fromChain], token.tokenAddress);
            } else {
                /// @dev reuse an already wrapped ERC721
                wrappedERC721Token = wrappedERC721Token_;
            }

            WERC721(wrappedERC721Token).safeMint(data.receiver, token.tokenId, metadata.tokenURI);
        }

        emit IBridge.ERC721WrappedCreated(evmChainId, token.tokenAddress, wrappedERC721Token);
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

    function _createWrapped(
        IBridge.ERC721Receive memory payload_,
        address token,
        string memory name_,
        string memory symbol_
    ) private returns (address wrappedERC721Token) {
        bytes32 salt = keccak256(abi.encodePacked(s_nonEvmChains[payload_.fromChain], token));
        wrappedERC721Token = address(new WERC721{salt: salt}(address(this), name_, symbol_));
    }

    /// @inheritdoc IBridge
    function onERC721Received(address operator, address, uint256, bytes calldata) external view returns (bytes4) {
        if (operator != address(this)) revert IBridge.TransferNotAllowed();
        return type(IERC721Receiver).interfaceId;
    }
}
