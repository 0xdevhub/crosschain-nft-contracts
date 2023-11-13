// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {IBaseAdapter, BaseAdapter} from "./BaseAdapter.sol";
import {IBridge} from "../interfaces/IBridge.sol";

contract CCIPAdapter is BaseAdapter, CCIPReceiver, AccessManaged {
    constructor(
        address bridge_,
        address accessManagement_,
        address router_
    ) BaseAdapter(bridge_) AccessManaged(accessManagement_) CCIPReceiver(router_) {}

    /// @inheritdoc IBaseAdapter
    function router() public view override returns (address) {
        return this.getRouter();
    }

    /// @inheritdoc IBaseAdapter
    function getFee(bytes memory calldata_) public view override returns (uint256) {
        (uint64 targetChain, Client.EVM2AnyMessage memory message) = abi.decode(
            calldata_,
            (uint64, Client.EVM2AnyMessage)
        );

        return IRouterClient(this.router()).getFee(targetChain, message);
    }

    /// @inheritdoc IBaseAdapter
    function feeToken() public pure override returns (address) {
        return address(0);
    }

    /**
     * @notice receive message from other chain via CCIP
     * @param any2EvmMessage chainlink crosschain EVM message
     * @dev only ccip router call call
     */
    function ccipReceive(Client.Any2EVMMessage memory any2EvmMessage) external override restricted {
        _ccipReceive(any2EvmMessage);
    }

    /**
     * @notice handle message receive
     * @param any2EvmMessage chainlink crosschain EVM message
     */
    function _ccipReceive(Client.Any2EVMMessage memory any2EvmMessage) internal override {
        IBridge.MessageReceive memory messageReceive = IBridge.MessageReceive({
            fromChain: any2EvmMessage.sourceChainSelector,
            sender: abi.decode(any2EvmMessage.sender, (address)),
            data: any2EvmMessage.data
        });

        _receiveMessage(messageReceive);
    }

    /// @inheritdoc IBaseAdapter
    function sendMessage(IBridge.MessageSend memory calldata_) external override restricted {
        _ccipSend(_chainIdToUint64(calldata_.toChain), calldata_.receiver, calldata_.data);
        emit IBaseAdapter.MessageSent(calldata_);
    }

    /**
     * @notice convert chain id to uint64
     * @param chainId_ chain id
     */
    function _chainIdToUint64(uint256 chainId_) internal pure returns (uint64) {
        return uint64(chainId_);
    }

    /**
     * @notice send message to other chain via CCIP
     * @param toChain target chain id
     * @param receiver_ receiver address
     * @param data_ encoded message data
     */
    function _ccipSend(uint64 toChain, address receiver_, bytes memory data_) private returns (bytes32) {
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(receiver_, data_);

        uint256 fees = getFee(abi.encode(toChain, evm2AnyMessage));

        return IRouterClient(router()).ccipSend{value: fees}(toChain, evm2AnyMessage);
    }

    function _buildCCIPMessage(
        address receiver_,
        bytes memory data_
    ) internal pure returns (Client.EVM2AnyMessage memory) {
        return
            Client.EVM2AnyMessage({
                receiver: abi.encode(receiver_),
                data: data_,
                tokenAmounts: new Client.EVMTokenAmount[](0),
                extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: 200_000, strict: false})),
                feeToken: address(0) // todo: baseAdapter getFeeToken if zero, use native
            });
    }
}
