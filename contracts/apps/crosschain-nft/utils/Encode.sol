// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

contract Encode {
    function toString(string memory value_) external pure returns (bytes memory) {
        return abi.encode(value_);
    }

    function encodePack(
        uint64 targetChain_,
        address receiver_,
        bytes memory data_
    ) external pure returns (bytes memory) {
        return abi.encode(targetChain_, receiver_, data_);
    }
}
