// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IBaseAdapter} from "../interfaces/IBaseAdapter.sol";
import {IBridge} from "../interfaces/IBridge.sol";

contract MockBridge is IBridge {
    address private s_adapter;

    /// @inheritdoc IBridge
    function setAdapter(address adapter_) public override {}

    /// @inheritdoc IBridge
    function adapter() external view override returns (address) {}

    /// @inheritdoc IBridge
    function lockAndMintERC721() external override {}

    /// @inheritdoc IBridge
    function burnAndUnlockERC721() external override {}

    /// @inheritdoc IBridge
    function commitOffRamp(IBridge.MessageReceive memory calldata_) external override {
        emit IBridge.MessageReceived(calldata_);
    }
}
