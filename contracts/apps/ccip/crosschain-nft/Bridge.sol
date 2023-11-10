// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {IBaseAdapter} from "./interfaces/IBaseAdapter.sol";

contract Bridge is IBaseAdapter, AccessManaged {
    using Address for address;

    address public s_adapter;

    constructor(address accessManagement_, address adapter_) AccessManaged(accessManagement_) {
        s_adapter = adapter_;
    }

    function commitOnRamp(bytes memory calldata_) external restricted {
        address(s_adapter).functionDelegateCall(abi.encodePacked(IBaseAdapter.commitOnRamp.selector, calldata_));
    }
}
