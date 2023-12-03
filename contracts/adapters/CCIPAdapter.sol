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
        return IRouterClient(router()).getFee(toChain, evm2AnyMessage);
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

    /// @inheritdoc IBaseAdapter
    function router() public view override returns (address) {
        return getRouter();
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

    /// @inheritdoc BaseAdapter
    function _sendMessage(IBridge.ERC721Send memory payload_, uint256 quotedFee_) internal override {
        _ccipSend(uint64(payload_.toChain), payload_.receiver, payload_.data, quotedFee_, payload_.gasLimit);

        emit IBaseAdapter.ERC721Sent(payload_.toChain, payload_.receiver, payload_.data);
    }

    function _ccipSend(
        uint64 toChain,
        address receiver_,
        bytes memory data_,
        uint256 quotedFee_,
        uint256 gasLimit_
    ) private {
        if (feeToken() != address(0)) {
            /// @dev get tokens and approve router to spend ERC20 token as fees
            IERC20(feeToken()).transferFrom(msg.sender, address(this), quotedFee_);
            IERC20(feeToken()).approve(router(), quotedFee_);

            IRouterClient(router()).ccipSend(toChain, _buildCCIPMessage(receiver_, data_, gasLimit_));
        } else {
            /// @dev spend native token as fees
            IRouterClient(router()).ccipSend{value: quotedFee_}(
                toChain,
                _buildCCIPMessage(receiver_, data_, gasLimit_)
            );
        }
    }
}
