// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {IBaseAdapter, BaseAdapter} from "./BaseAdapter.sol";
import {IBridge} from "../interfaces/IBridge.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CCIPAdapter is BaseAdapter, CCIPReceiver {
    mapping(uint256 => IBridge.ERC721Receive) private s_pendingMessagesToExecute;
    mapping(uint256 => IBridge.ERC721Receive) private s_pendingMessagesExecuted;

    uint256 private s_pendingMessagesCount;
    uint256 private s_pendingMessagesExecutedCount;

    error NoMessagesAvailable();

    constructor(
        address bridge_,
        address accessManagement_,
        address router_,
        address feeToken_
    ) BaseAdapter(bridge_, accessManagement_, feeToken_) CCIPReceiver(router_) {}

    /// @inheritdoc IBaseAdapter
    function getFee(IBridge.ERC721Send memory payload_) public view override returns (uint256) {
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(
            payload_.receiver,
            payload_.data,
            payload_.gasLimit
        );

        return _getFee(uint64(payload_.toChain), evm2AnyMessage);
    }

    function _getFee(uint64 toChain, Client.EVM2AnyMessage memory evm2AnyMessage) internal view returns (uint256) {
        return IRouterClient(getRouter()).getFee(toChain, evm2AnyMessage);
    }

    function _buildCCIPMessage(
        address receiver_,
        bytes memory data_,
        uint256 gasLimit_
    ) private view returns (Client.EVM2AnyMessage memory) {
        return
            Client.EVM2AnyMessage({
                receiver: abi.encode(receiver_),
                data: data_,
                tokenAmounts: new Client.EVMTokenAmount[](0),
                /// @dev set strict to false to allow send message any time
                extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: gasLimit_, strict: false})),
                /// @dev if zero address it will be set to native token
                feeToken: feeToken()
            });
    }

    /// @inheritdoc CCIPReceiver
    function ccipReceive(Client.Any2EVMMessage memory any2EvmMessage) external override restricted {
        _ccipReceive(any2EvmMessage);
    }

    /// @inheritdoc CCIPReceiver
    function _ccipReceive(Client.Any2EVMMessage memory any2EvmMessage) internal override {
        IBridge.ERC721Receive memory payload = IBridge.ERC721Receive({
            fromChain: any2EvmMessage.sourceChainSelector,
            sender: abi.decode(any2EvmMessage.sender, (address)),
            data: any2EvmMessage.data
        });

        _receiveMessage(payload);
    }

    function _receiveMessage(IBridge.ERC721Receive memory payload_) internal virtual override {
        try IBridge(bridge()).receiveERC721(payload_) {
            /// @dev if success, just bypass
        } catch {
            _setPendingMessage(payload_);
        }

        emit IBaseAdapter.ERC721Received(payload_.fromChain, payload_.sender, payload_.data);
    }

    function _setPendingMessage(IBridge.ERC721Receive memory payload_) private {
        s_pendingMessagesToExecute[s_pendingMessagesCount++] = payload_;
    }

    function manuallyExecuteMessages(uint256 limitToExecute_) public {
        if (s_pendingMessagesCount == 0) revert NoMessagesAvailable();

        for (uint256 i = 0; i < limitToExecute_; i++) {
            IBridge.ERC721Receive memory payload = s_pendingMessagesToExecute[i];

            _receiveMessage(payload);

            s_pendingMessagesExecuted[s_pendingMessagesExecutedCount++] = payload;
            s_pendingMessagesCount--;
        }
    }

    function getPendingMessage(uint256 index_) public view returns (IBridge.ERC721Receive memory) {
        return s_pendingMessagesToExecute[index_];
    }

    function getExecutedMessage(uint256 index_) public view returns (IBridge.ERC721Receive memory) {
        return s_pendingMessagesExecuted[index_];
    }

    /// @inheritdoc BaseAdapter
    function _sendMessage(IBridge.ERC721Send memory payload_, uint256 quotedFee_) internal override {
        bool isFeeTokenNative = feeToken() == address(0);

        /// @dev get tokens and approve router to spend ERC20 token as fees if not native token
        if (!isFeeTokenNative) {
            IERC20(feeToken()).transferFrom(msg.sender, address(this), quotedFee_);
            IERC20(feeToken()).approve(getRouter(), quotedFee_);
        }

        uint256[2] memory tokenAmounts_ = [payload_.gasLimit, quotedFee_];

        _ccipSend(uint64(payload_.toChain), payload_.receiver, payload_.data, isFeeTokenNative, tokenAmounts_);

        emit IBaseAdapter.ERC721Sent(payload_.toChain, payload_.receiver, payload_.data);
    }

    function _ccipSend(
        uint64 toChain,
        address receiver_,
        bytes memory data_,
        bool isFeeTokenNative,
        uint256[2] memory tokenAmounts_
    ) private {
        IRouterClient router = IRouterClient(getRouter());
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(receiver_, data_, tokenAmounts_[0]);

        if (!isFeeTokenNative) {
            router.ccipSend(toChain, evm2AnyMessage);
        } else {
            /// @dev spend native token as fees
            router.ccipSend{value: tokenAmounts_[1]}(toChain, evm2AnyMessage);
        }
    }
}
