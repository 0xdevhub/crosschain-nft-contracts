// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

contract MockBridge {
    struct ERC721Receive {
        uint256 fromChain;
        address sender;
        bytes data;
    }

    event ERC721Received(ERC721Receive indexed message_);

    function receiveERC721(ERC721Receive memory calldata_) external {
        emit ERC721Received(calldata_);
    }
}
