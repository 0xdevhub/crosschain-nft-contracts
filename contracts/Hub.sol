// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.21;

import {AppType, App} from "./interfaces/IApp.sol";

contract Hub {
    mapping(bytes32 => App) private _apps;

    event Hub_AppCreated(bytes32 indexed appId);

    error Hub_UnknownAppType();

    function createApp(AppType appType_, address appAddress_) external returns (bytes32) {
        App memory app = App({
            owner: msg.sender,
            appType: appType_,
            appAddress: appAddress_,
            createdAt: block.timestamp
        });

        bytes32 appId = keccak256(abi.encodePacked(msg.sender, appType_, appAddress_));

        _apps[appId] = app;

        emit Hub_AppCreated(appId);

        return appId;
    }

    function getApp(bytes32 appId) external view returns (App memory) {
        return _apps[appId];
    }
}
