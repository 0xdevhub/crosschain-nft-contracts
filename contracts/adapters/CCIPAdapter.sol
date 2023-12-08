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
    /// @dev messages storage
    IBaseAdapter.MessageReceive[] private s_pendingMessagesToExecute;
    uint256 private s_messagesExecutedCount;

    /// @dev interval in seconds to automation execute messages
    uint256 private s_updateInterval = 60;

    /// @dev last timestamp when performUpkeep was executed
    uint256 private s_lastTimeStampPerformUpkeep;

    /// @dev default limit of messages to execute (batch)
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

    /// @dev check if there are any messages available to execute
    function checkUpkeep(
        bytes calldata /* checkData */
    ) external view override returns (bool upkeepNeeded, bytes memory /* performData */) {
        if ((block.timestamp - s_lastTimeStampPerformUpkeep) > s_updateInterval) {
            /// @dev execute messages if there are any message available
            upkeepNeeded = s_pendingMessagesToExecute.length > 0;
        } else {
            upkeepNeeded = false;
        }

        return (upkeepNeeded, "");
    }

    /// @dev interface required by Chainlink Automation
    function performUpkeep(bytes calldata /* performData */) external override {
        if (s_pendingMessagesToExecute.length == 0) revert NoMessagesAvailable();

        executeMessages(s_defaultExecutionLimit);
        s_lastTimeStampPerformUpkeep = block.timestamp;
    }

    function getLastTimeStampPerformUpkeep() public view returns (uint256) {
        return s_lastTimeStampPerformUpkeep;
    }

    /// @inheritdoc IBaseAdapter
    function getFee(IBaseAdapter.MessageSend memory payload_) public view override returns (uint256) {
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(
            payload_.receiver,
            payload_.data,
            payload_.gasLimit
        );

        return _getFee(uint64(payload_.toChain), evm2AnyMessage);
    }

    /**
     * @notice get fee amount require for sending message using Chainlink CCIP
     * @param toChain_ target chain
     * @param evm2AnyMessage_ message payload
     */
    function _getFee(uint64 toChain_, Client.EVM2AnyMessage memory evm2AnyMessage_) internal view returns (uint256) {
        return IRouterClient(getRouter()).getFee(toChain_, evm2AnyMessage_);
    }

    /**
     * @notice build CCIP message payload
     * @param receiver_ address of receiver (crosschain adapter)
     * @param data_ message payload
     * @param gasLimit_ gas limit
     */
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
        IBaseAdapter.MessageReceive memory payload = IBaseAdapter.MessageReceive({
            fromChain: any2EvmMessage.sourceChainSelector,
            sender: abi.decode(any2EvmMessage.sender, (address)),
            data: any2EvmMessage.data
        });

        _receiveMessage(payload);
    }

    /**
     * @notice set income message as pending to execute, its override default behavior from BaseAdapter
     *         to allow automation to execute messages in batches (s_defaultExecutionLimit)
     * @param payload_ message payload
     */
    function _receiveMessage(IBaseAdapter.MessageReceive memory payload_) internal virtual override {
        /// @dev try before set as peding
        try IBridge(getBridge()).receiveERC721(payload_) {
            /** @dev ignore */
        } catch {
            _setPendingMessage(payload_);
        }

        emit IBaseAdapter.MessageReceived(payload_.fromChain, payload_.sender, payload_.data);
    }

    function _setPendingMessage(IBaseAdapter.MessageReceive memory payload_) private {
        s_pendingMessagesToExecute.push(payload_);
    }

    function getPendingMessage(uint256 index_) public view returns (IBaseAdapter.MessageReceive memory) {
        if (s_pendingMessagesToExecute.length == 0 || index_ > s_pendingMessagesToExecute.length - 1) {
            revert NoMessagesAvailable();
        }

        return s_pendingMessagesToExecute[index_];
    }

    /**
     * @notice {public} to execute pending messages in batches  manually
     * @param limitToExecute_ amount of messages to execute (batch)
     */
    function executeMessages(uint256 limitToExecute_) public {
        if (limitToExecute_ == 0 || s_pendingMessagesToExecute.length == 0) revert NoMessagesAvailable();

        uint256 limit = limitToExecute_ > s_pendingMessagesToExecute.length
            ? s_pendingMessagesToExecute.length
            : limitToExecute_;

        uint256 lastIndex = limit - 1;
        uint256 messagesToDelete = limit;

        /// @dev execute pending messages
        while (limit > 0) {
            IBaseAdapter.MessageReceive memory payload = s_pendingMessagesToExecute[lastIndex];

            _receiveMessage(payload);

            s_messagesExecutedCount++;

            if (lastIndex > 0) {
                lastIndex--;
            }

            limit--;
        }

        /// @dev remove pending messages from the list
        while (messagesToDelete > 0) {
            s_pendingMessagesToExecute.pop();
            messagesToDelete--;
        }
    }

    /// @dev amount of executed messages
    function getMessagesExecutedCount() public view returns (uint256) {
        return s_messagesExecutedCount;
    }

    /// @dev amount of pending messages to execute
    function getPendingMessagesToExecuteCount() public view returns (uint256) {
        return s_pendingMessagesToExecute.length;
    }

    /// @inheritdoc BaseAdapter
    function _sendMessage(IBaseAdapter.MessageSend memory payload_, uint256 quotedFee_) internal override {
        bool isFeeTokenNative = feeToken() == address(0);

        /// @dev get tokens and approve router to spend ERC20 token as fees if not native token
        if (!isFeeTokenNative) {
            IERC20(feeToken()).transferFrom(msg.sender, address(this), quotedFee_);
            IERC20(feeToken()).approve(getRouter(), quotedFee_);
        }

        /// @dev set token amounts that is required for send the message
        uint256[2] memory tokenAmounts_ = [payload_.gasLimit, quotedFee_];

        _ccipSend(uint64(payload_.toChain), payload_.receiver, payload_.data, isFeeTokenNative, tokenAmounts_);

        emit IBaseAdapter.MessageSent(payload_.toChain, payload_.receiver, payload_.data);
    }

    /**
     * @notice send message using chainlink CCIP
     * @param toChain_ target chain
     * @param receiver_ receiver address
     * @param data_ message payload
     * @param isFeeTokenNative is fee token native
     * @param tokenAmounts_ token amounts
     */
    function _ccipSend(
        uint64 toChain_,
        address receiver_,
        bytes memory data_,
        bool isFeeTokenNative,
        uint256[2] memory tokenAmounts_
    ) private {
        IRouterClient router = IRouterClient(getRouter());
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(receiver_, data_, tokenAmounts_[0]);

        if (isFeeTokenNative) {
            /// @dev spend native token as fees
            router.ccipSend{value: tokenAmounts_[1]}(toChain_, evm2AnyMessage);
        } else {
            /// @dev just send message since we already approved router to spend ERC20 token as fees
            router.ccipSend(toChain_, evm2AnyMessage);
        }
    }
}
