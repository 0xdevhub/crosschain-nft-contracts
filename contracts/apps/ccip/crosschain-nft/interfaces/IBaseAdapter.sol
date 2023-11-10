// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface IBaseAdapter {
    function commitOnRamp(bytes memory calldata_) external;
}
