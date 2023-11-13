// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {IBaseAdapter, BaseAdapter} from "./BaseAdapter.sol";
import {IBridge} from "../interfaces/IBridge.sol";

contract CCIPAdapter is BaseAdapter, CCIPReceiver, AccessManaged {
    constructor(
        IBridge bridge_,
        address accessManagement_,
        address ccipRouter_
    ) BaseAdapter(bridge_) CCIPReceiver(ccipRouter_) AccessManaged(accessManagement_) {}

    /// @dev only router call call
    function ccipReceive(Client.Any2EVMMessage memory any2EvmMessage) external override restricted {
        _ccipReceive(any2EvmMessage);
    }

    function _ccipReceive(Client.Any2EVMMessage memory any2EvmMessage) internal override {
        // @todo: implement receive message, encode to known bytes
        // _receiveMessage();
    }

    /// @inheritdoc IBaseAdapter
    /// @dev only protocol can call
    function sendMessage(bytes memory calldata_) external override restricted returns (bytes memory) {
        (uint64 targetChain, address receiver, bytes memory data) = abi.decode(calldata_, (uint64, address, bytes));

        bytes32 messageId = _ccipSend(targetChain, receiver, data);

        emit IBaseAdapter.MessageSent(abi.encodePacked(messageId));

        return abi.encode(messageId);
    }

    function _ccipSend(uint64 targetChain_, address receiver_, bytes memory data_) private returns (bytes32 messageId) {
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(receiver_, data_);

        uint256 fees = getFee(abi.encode(targetChain_, evm2AnyMessage));

        IRouterClient router = IRouterClient(this.getRouter());

        messageId = router.ccipSend{value: fees}(targetChain_, evm2AnyMessage);
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

    /// @inheritdoc IBaseAdapter
    function getFee(bytes memory calldata_) public view override returns (uint256) {
        IRouterClient router = IRouterClient(this.getRouter());

        (uint64 targetChain, Client.EVM2AnyMessage memory message) = abi.decode(
            calldata_,
            (uint64, Client.EVM2AnyMessage)
        );

        return router.getFee(targetChain, message);
    }

    /// @inheritdoc IBaseAdapter
    function getFeeToken() public pure override returns (address) {
        return address(0);
    }
}
