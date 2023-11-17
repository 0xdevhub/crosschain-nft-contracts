// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IBaseAdapter} from "../interfaces/IBaseAdapter.sol";
import {IBridge} from "../interfaces/IBridge.sol";

contract MockBridge is IBridge, AccessManaged {
    address private s_adapter;

    constructor(address accessManagement_) AccessManaged(accessManagement_) {}

    /// ================== SETTINGS =========================

    /// @inheritdoc IBridge
    function setAdapter(address adapter_) public override restricted {
        _setAdapter(adapter_);
    }

    function _setAdapter(address adapter_) private {
        s_adapter = adapter_;

        emit IBridge.AdapterChanged(adapter_);
    }

    /// @inheritdoc IBridge
    function adapter() external view override returns (address) {
        return s_adapter;
    }

    /// @inheritdoc IBridge
    function commitOffRamp(IBridge.MessageReceive memory calldata_) external override {
        emit IBridge.MessageReceived(calldata_);
    }
}
