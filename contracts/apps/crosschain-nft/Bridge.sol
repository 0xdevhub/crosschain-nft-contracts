// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IBaseAdapter} from "./interfaces/IBaseAdapter.sol";
import {IBridge} from "./interfaces/IBridge.sol";

contract Protocol is IBridge, AccessManaged {
    // @todo: define message income / outcome in struct mapping

    IBaseAdapter private s_adapter;

    constructor(address accessManagement_, IBaseAdapter adapter_) AccessManaged(accessManagement_) {
        _setAdapter(adapter_);
    }

    function _setAdapter(IBaseAdapter adapter_) internal {
        s_adapter = adapter_;

        emit IBridge.AdapterChange(adapter_);
    }

    /// @inheritdoc IBridge
    function setAdapter(IBaseAdapter adapter_) public override restricted {
        _setAdapter(adapter_);
    }

    /// @inheritdoc IBridge
    function adapter() external view override returns (IBaseAdapter) {
        return s_adapter;
    }

    /// @inheritdoc IBridge
    function lockAndMintERC721() external override {
        // @todo: lock and mint from source to target chain
    }

    /// @inheritdoc IBridge
    function burnAndUnlockERC721() external override {
        // @todo: burn and unlock from target to source chain
    }

    /**
     * @notice send message to adapter
     * @param calldata_ encoded payload to send to adapter
     */
    function _commitOnRamp(bytes memory calldata_) private returns (bytes memory) {
        return s_adapter.sendMessage(calldata_);
    }

    /// @inheritdoc IBridge
    function commitOffRamp(bytes memory calldata_) external override restricted returns (bytes memory) {
        // @todo: receive message from adapter
    }
}
