// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {IBaseAdapter} from "../interfaces/IBaseAdapter.sol";

contract CCIPAdapter is IBaseAdapter, CCIPReceiver, AccessManaged {
    constructor(
        address accessManagement_,
        address ccipRouter
    ) CCIPReceiver(ccipRouter) AccessManaged(accessManagement_) {}

    /// @dev only router call call
    function ccipReceive(Client.Any2EVMMessage memory any2EvmMessage) external override restricted {
        _ccipReceive(any2EvmMessage);
    }

    function _ccipReceive(Client.Any2EVMMessage memory any2EvmMessage) internal override {
        /// ToDo: call commitOfframp using the bridge
        emit IBaseAdapter.MessageReceived(any2EvmMessage.data);
    }

    /// @dev only bridge can call
    function sendMessage(bytes memory calldata_) external override restricted returns (bytes memory) {
        (uint64 targetChain, address receiver, bytes memory data, address feeToken) = abi.decode(
            calldata_,
            (uint64, address, bytes, address)
        );

        bytes32 messageId = _ccipSend(targetChain, receiver, data, feeToken);

        return abi.encode(messageId);
    }

    function _ccipSend(
        uint64 targetChain_,
        address receiver_,
        bytes memory data_,
        address feeToken_
    ) private returns (bytes32 messageId) {
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(receiver_, data_, feeToken_);

        IRouterClient router = IRouterClient(this.getRouter());

        IERC20(feeToken_).approve(address(router), getFee(abi.encode(targetChain_, evm2AnyMessage)));

        messageId = router.ccipSend(targetChain_, evm2AnyMessage);

        emit IBaseAdapter.MessageSent(abi.encodePacked(messageId));
    }

    function _buildCCIPMessage(
        address receiver_,
        bytes memory data_,
        address feeToken_
    ) internal pure returns (Client.EVM2AnyMessage memory) {
        return
            Client.EVM2AnyMessage({
                receiver: abi.encode(receiver_),
                data: data_,
                tokenAmounts: new Client.EVMTokenAmount[](0),
                extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: 200_000, strict: false})),
                feeToken: feeToken_
            });
    }

    function getFee(bytes memory calldata_) public view override returns (uint256) {
        IRouterClient router = IRouterClient(this.getRouter());

        (uint64 targetChain, Client.EVM2AnyMessage memory message) = abi.decode(
            calldata_,
            (uint64, Client.EVM2AnyMessage)
        );

        return router.getFee(targetChain, message);
    }
}
