// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {IBaseAdapter} from "../interfaces/IBaseAdapter.sol";

contract CCIPAdapter is IBaseAdapter, AccessManaged, CCIPReceiver {
    constructor(address accessManagement_, address router_) AccessManaged(accessManagement_) CCIPReceiver(router_) {}

    function ccipReceive(Client.Any2EVMMessage memory any2EvmMessage) external override restricted {
        _ccipReceive(any2EvmMessage);
    }

    function _ccipReceive(Client.Any2EVMMessage memory any2EvmMessage) internal override {}

    function _ccipSend(Client.Any2EVMMessage memory any2EvmMessage) private {}

    function commitOnRamp(bytes memory calldata_) external override restricted {
        // decode calldata and call _ccipSend
    }
}
