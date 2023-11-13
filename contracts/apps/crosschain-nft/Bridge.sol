// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IBaseAdapter} from "./interfaces/IBaseAdapter.sol";
import {IBridge} from "./interfaces/IBridge.sol";

contract Bridge is IBridge, AccessManaged {
    address private s_adapter;

    mapping(uint256 => IBridge.MessageSend) public s_sentMessages;
    mapping(uint256 => IBridge.MessageReceive) public s_receivedMessages;

    constructor(address accessManagement_, address adapter_) AccessManaged(accessManagement_) {
        _setAdapter(adapter_);
    }

    function _setAdapter(address adapter_) internal {
        s_adapter = adapter_;

        emit IBridge.AdapterChanged(adapter_);
    }

    /// @inheritdoc IBridge
    function setAdapter(address adapter_) public override restricted {
        _setAdapter(adapter_);
    }

    /// @inheritdoc IBridge
    function adapter() external view override returns (address) {
        return s_adapter;
    }

    /// @inheritdoc IBridge
    function lockAndMintERC721() external override {}

    /// @inheritdoc IBridge
    function burnAndUnlockERC721() external override {}

    /**
     * @notice send message to adapter
     * @param calldata_ encoded data to send to adapter
     */
    function _commitOnRamp(IBridge.MessageSend memory calldata_) private {
        IBaseAdapter(s_adapter).sendMessage(calldata_);
        emit IBridge.MessageSent(calldata_);
    }

    /// @inheritdoc IBridge
    function commitOffRamp(IBridge.MessageReceive memory calldata_) external override restricted {
        /// todo: handle offramp message
        emit IBridge.MessageReceived(calldata_);
    }
}
