// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IBridge} from "../interfaces/IBridge.sol";

contract MockAdapter {
    uint256 private s_fee;

    event ERC721Sent(IBridge.ERC721Send data_);

    function setFee(uint256 fee_) external {
        s_fee = fee_;
    }

    function getFee(IBridge.ERC721Send memory /*payload*/) public view returns (uint256) {
        return s_fee;
    }

    function sendMessage(IBridge.ERC721Send memory payload_) external payable {}

    function receiveMessage(IBridge.ERC721Receive memory payload_, address bridge_) external {
        IBridge(bridge_).receiveERC721(payload_);
    }
}
