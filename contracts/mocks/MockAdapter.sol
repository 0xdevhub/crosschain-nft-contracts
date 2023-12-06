// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IBridge} from "../interfaces/IBridge.sol";
import {IBaseAdapter} from "../interfaces/IBaseAdapter.sol";

contract MockAdapter is IBaseAdapter {
    uint256 private s_fee;
    address private s_feeToken;
    address private s_bridge;

    function setFeeToken(address feeToken_) external {
        s_feeToken = feeToken_;
    }

    function feeToken() external view returns (address) {
        return s_feeToken;
    }

    function setFee(uint256 fee_) external {
        s_fee = fee_;
    }

    function getFee(IBaseAdapter.MessageSend memory /*payload*/) public view returns (uint256) {
        return s_fee;
    }

    function setBridge(address bridge_) external {
        s_bridge = bridge_;
    }

    function getBridge() external view override returns (address) {
        return s_bridge;
    }

    function sendMessageUsingNative(IBaseAdapter.MessageSend memory payload_) external payable {}

    function sendMessageUsingERC20(IBaseAdapter.MessageSend memory payload_, uint256 amount_) external {}

    function receiveMessage(IBaseAdapter.MessageReceive memory payload_, address bridge_) external {
        IBridge(bridge_).receiveERC721(payload_);
    }
}
