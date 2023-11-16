// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IBaseAdapter} from "./interfaces/IBaseAdapter.sol";
import {IBridge} from "./interfaces/IBridge.sol";

/// todo: set wrapped asset or create wrapped on lock
/// todo: isAllowedSender
/// todo: isAllowedSourceChain
/// todo: setGasLimit (default 200_000)

contract Bridge is IBridge, AccessManaged {
    address private s_adapter;

    constructor(address accessManagement_, address adapter_) AccessManaged(accessManagement_) {
        _setAdapter(adapter_);
    }

    function _setAdapter(address adapter_) private {
        s_adapter = adapter_;

        emit IBridge.AdapterChanged(adapter_);
    }

    /// ================== SETTINGS =========================

    /// @inheritdoc IBridge
    function setAdapter(address adapter_) public override restricted {
        _setAdapter(adapter_);
    }

    /// @inheritdoc IBridge
    function adapter() external view override returns (address) {
        return s_adapter;
    }

    /// ================== ON/OFFRAMP =========================

    /**
     * @notice send message to adapter
     * @param calldata_ data to send to adapter
     */
    function _commitOnRamp(IBridge.MessageSend memory calldata_) private {
        IBaseAdapter(s_adapter).sendMessage(calldata_);
        emit IBridge.MessageSent(calldata_);
    }

    /// @inheritdoc IBridge
    /// @dev only adapter can call
    function commitOffRamp(IBridge.MessageReceive memory calldata_) external override restricted {
        /// todo: handle offramp message
        emit IBridge.MessageReceived(calldata_);
    }
}
