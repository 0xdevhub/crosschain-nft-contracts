// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.21;

enum AppType {
    Vault
}

contract Hub {
    struct App {
        address owner;
        uint256 createdAt;
        AppType appType;
        address appAddress;
    }

    mapping(bytes32 => App) private _apps;

    event Hub_AppCreated(bytes32 indexed appId);

    function createApp(AppType appType_, address appAddress_) external returns (bytes32) {
        App memory app = App({
            owner: msg.sender,
            appType: appType_,
            createdAt: block.timestamp,
            appAddress: appAddress_
        });

        bytes32 appId = keccak256(abi.encodePacked(msg.sender, appAddress_));

        _apps[appId] = app;

        emit Hub_AppCreated(appId);

        return appId;
    }

    function getApp(bytes32 appId) external view returns (App memory) {
        return _apps[appId];
    }
}
