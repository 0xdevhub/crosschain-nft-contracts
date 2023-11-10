// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {IBaseAdapter} from "./interfaces/IBaseAdapter.sol";

/// required fee token
/// transfer fees to adapter
/// call adapter sendMessage

contract Bridge is AccessManaged {
    IBaseAdapter public s_adapter;

    constructor(address accessManagement_, IBaseAdapter adapter_) AccessManaged(accessManagement_) {
        s_adapter = adapter_;
    }

    function commitOnRamp(bytes memory calldata_) external restricted returns (bytes memory) {
        return s_adapter.sendMessage(calldata_);
    }
}
