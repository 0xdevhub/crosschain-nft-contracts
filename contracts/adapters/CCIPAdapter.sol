// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {IBaseAdapter, BaseAdapter} from "./BaseAdapter.sol";
import {IBridge} from "../interfaces/IBridge.sol";

contract CCIPAdapter is BaseAdapter, CCIPReceiver {
    constructor(
        address bridge_,
        address accessManagement_,
        address router_
    ) BaseAdapter(bridge_, accessManagement_) CCIPReceiver(router_) {}

    /// @inheritdoc IBaseAdapter
    function getFee(IBridge.MessageSend memory payload_) public view override returns (uint256) {
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(payload_.receiver, payload_.data);

        return _getFee(uint64(payload_.toChain), evm2AnyMessage);
    }

    /**
     * @notice build CCIP message
     * @param receiver_ address of receiver
     * @param data_ encoded message data
     */
    function _buildCCIPMessage(
        address receiver_,
        bytes memory data_
    ) private pure returns (Client.EVM2AnyMessage memory) {
        return
            Client.EVM2AnyMessage({
                receiver: abi.encode(receiver_),
                data: data_,
                tokenAmounts: new Client.EVMTokenAmount[](0),
                extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: 200_000, strict: false})),
                feeToken: feeToken()
            });
    }

    function _getFee(uint64 toChain, Client.EVM2AnyMessage memory evm2AnyMessage) internal view returns (uint256) {
        return IRouterClient(router()).getFee(toChain, evm2AnyMessage);
    }

    /// @inheritdoc IBaseAdapter
    function router() public view override returns (address) {
        return getRouter();
    }

    /// @inheritdoc CCIPReceiver
    /// @dev only ccip router can call
    function ccipReceive(Client.Any2EVMMessage memory any2EvmMessage) external override restricted {
        _ccipReceive(any2EvmMessage);
    }

    /// @inheritdoc CCIPReceiver
    /// @dev override ccip receive and implement _receiveMessage from BaseAdapter
    function _ccipReceive(Client.Any2EVMMessage memory any2EvmMessage) internal override {
        IBridge.MessageReceive memory payload = IBridge.MessageReceive({
            fromChain: any2EvmMessage.sourceChainSelector,
            sender: abi.decode(any2EvmMessage.sender, (address)),
            data: any2EvmMessage.data
        });

        _receiveMessage(payload);
    }

    /// @inheritdoc BaseAdapter
    function _sendMessage(IBridge.MessageSend memory payload, uint256 quotedFee_) internal override {
        _ccipSend(uint64(payload.toChain), payload.receiver, payload.data, quotedFee_);

        emit IBaseAdapter.MessageSent(payload.toChain, payload.receiver, payload.data);
    }

    /**
     * @notice send message to other chain via CCIP
     * @param toChain target chain id
     * @param receiver_ receiver address
     * @param data_ encoded message data
     */
    function _ccipSend(uint64 toChain, address receiver_, bytes memory data_, uint256 quotedFee_) private {
        IRouterClient(router()).ccipSend{value: quotedFee_}(toChain, _buildCCIPMessage(receiver_, data_));
    }
}
