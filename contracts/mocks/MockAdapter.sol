// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IBaseAdapter, BaseAdapter} from "../adapters/BaseAdapter.sol";
import {IBridge} from "../interfaces/IBridge.sol";

contract MockAdapter is BaseAdapter {
    address private s_router;

    constructor(address bridge_, address accessManagement_, address router_) BaseAdapter(bridge_, accessManagement_) {
        s_router = router_;
    }

    function router() public view override returns (address) {
        return s_router;
    }

    function getFee(IBridge.MessageSend memory /*payload_*/) public pure override returns (uint256) {
        return 0;
    }

    function feeToken() public pure override returns (address) {
        return address(0);
    }

    function receiveMessage(IBridge.MessageReceive memory payload_) external restricted {
        emit IBaseAdapter.MessageReceived(payload_);
    }

    function _sendMessage(IBridge.MessageSend memory payload_, uint256 /*quotedFee*/) internal override restricted {
        emit IBaseAdapter.MessageSent(payload_);
    }
}
