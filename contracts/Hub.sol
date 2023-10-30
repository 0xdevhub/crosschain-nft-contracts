// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.21;

import "hardhat/console.sol";

contract Hub {
    struct App {
        address owner;
        uint256 createdAt;
    }

    mapping(bytes32 => App) private _apps;

    event Hub_AppCreated(bytes32 indexed appId);

    function createApp() external returns (bytes32) {
        App memory app = App(msg.sender, block.timestamp);

        bytes32 appId = keccak256(abi.encodePacked(msg.sender));

        _apps[appId] = app;

        console.logBytes32(appId);

        emit Hub_AppCreated(appId);

        return appId;
    }

    function getApp(bytes32 appId) external view returns (App memory) {
        return _apps[appId];
    }
}
