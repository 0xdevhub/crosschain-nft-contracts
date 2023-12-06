// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {IBaseAdapter, BaseAdapter} from "./BaseAdapter.sol";
import {IBridge} from "../interfaces/IBridge.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

contract CCIPAdapter is BaseAdapter, CCIPReceiver, AutomationCompatibleInterface {
    IBridge.ERC721Receive[] private s_pendingMessagesToExecute;

    /// @dev updateInterval is used to check in seconds if upkeep is needed
    uint256 private s_updateInterval = 60;
    uint256 private s_lastTimeStamp;
    uint256 private s_defaultExecutionLimit = 10;

    error NoMessagesAvailable();

    constructor(
        address bridge_,
        address accessManagement_,
        address router_,
        address feeToken_
    ) BaseAdapter(bridge_, accessManagement_, feeToken_) CCIPReceiver(router_) {}

    function setUpdateInterval(uint256 updateInterval_) external restricted {
        s_updateInterval = updateInterval_;
    }

    function updateInterval() public view returns (uint256) {
        return s_updateInterval;
    }

    function setDefaultExecutionLimit(uint256 defaultExecutionLimit_) external restricted {
        s_defaultExecutionLimit = defaultExecutionLimit_;
    }

    function defaultExecutionLimit() public view returns (uint256) {
        return s_defaultExecutionLimit;
    }

    function checkUpkeep(
        bytes calldata /* checkData */
    ) external view override returns (bool upkeepNeeded, bytes memory /* performData */) {
        if ((block.timestamp - s_lastTimeStamp) > s_updateInterval) {
            /// @dev execute messages if there are any message available
            upkeepNeeded = s_pendingMessagesToExecute.length > 0;
        } else {
            upkeepNeeded = false;
        }

        return (upkeepNeeded, "");
    }

    function performUpkeep(bytes calldata /* performData */) external override {
        if ((block.timestamp - s_lastTimeStamp) > s_updateInterval) {
            s_lastTimeStamp = block.timestamp;
            executeMessages(s_defaultExecutionLimit);
        }
    }

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
        _setPendingMessage(payload_);
        emit IBaseAdapter.ERC721Received(payload_.fromChain, payload_.sender, payload_.data);
    }

    function _setPendingMessage(IBridge.ERC721Receive memory payload_) private {
        s_pendingMessagesToExecute.push(payload_);
    }

    function executeMessages(uint256 limitToExecute_) public {
        if (s_pendingMessagesToExecute.length == 0) revert NoMessagesAvailable();

        uint256 limit = limitToExecute_ > s_pendingMessagesToExecute.length
            ? s_pendingMessagesToExecute.length
            : limitToExecute_;

        uint256 lastIndex = limit - 1;
        uint256 itemsToDelete = limit;

        while (limit > 0) {
            IBridge.ERC721Receive memory payload = s_pendingMessagesToExecute[lastIndex];

            IBridge(getBridge()).receiveERC721(payload);

            if (lastIndex > 0) {
                lastIndex--;
            }

            limit--;
        }

        while (itemsToDelete > 0) {
            s_pendingMessagesToExecute.pop();
            itemsToDelete--;
        }
    }

    function getPendingMessage(uint256 index_) public view returns (IBridge.ERC721Receive memory) {
        return s_pendingMessagesToExecute[index_];
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
