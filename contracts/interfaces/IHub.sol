// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {App} from "./IApp.sol";

interface IHub {
    event Hub_AppCreated(bytes32 indexed appId_);

    error Hub_AdapterNotFound(bytes32 adapterId_);

    function createApp(bytes32 adapterId_, address adapterAddress_) external returns (bytes32);

    function getApp(bytes32 appId_) external view returns (App memory);
}
