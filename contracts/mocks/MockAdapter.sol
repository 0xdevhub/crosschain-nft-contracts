// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IBridge} from "../interfaces/IBridge.sol";

contract MockAdapter {
    uint256 private s_fee;
    address private s_feeToken;

    event ERC721Sent(IBridge.ERC721Send data_);

    function setFeeToken(address feeToken_) external {
        s_feeToken = feeToken_;
    }

    function feeToken() external view returns (address) {
        return s_feeToken;
    }

    function setFee(uint256 fee_) external {
        s_fee = fee_;
    }

    function getFee(IBridge.ERC721Send memory /*payload*/) public view returns (uint256) {
        return s_fee;
    }

    function sendMessageUsingNative(IBridge.ERC721Send memory payload_) external payable {}

    function sendMessageUsingERC20(IBridge.ERC721Send memory payload_, uint256 amount_) external {}

    function receiveMessage(IBridge.ERC721Receive memory payload_, address bridge_) external {
        IBridge(bridge_).receiveERC721(payload_);
    }
}
