// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

contract MockBridge {
    struct MessageReceive {
        uint256 fromChain;
        address sender;
        bytes data;
    }

    event MessageReceived(MessageReceive indexed message_);

    function receiveERC721(MessageReceive memory calldata_) external {
        emit MessageReceived(calldata_);
    }
}
