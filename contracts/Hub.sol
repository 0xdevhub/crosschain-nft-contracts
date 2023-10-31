// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.21;

import {IHub} from "./interfaces/IHub.sol";
import {IRegistry} from "./interfaces/IRegistry.sol";
import {App} from "./interfaces/IApp.sol";
import {Adapter} from "./interfaces/IAdapter.sol";

contract Hub is IHub {
    IRegistry public immutable registryAddress;

    mapping(bytes32 => App) private _apps;

    constructor(IRegistry registryAddress_) {
        registryAddress = registryAddress_;
    }

    modifier onlyRegistryAdapter(bytes32 adapterId_) {
        if (!registryAddress.isAdapter(adapterId_)) {
            revert IHub.Hub_AdapterNotFound(adapterId_);
        }
        _;
    }

    function createApp(
        bytes32 adapterId_,
        address appAddress_
    ) external onlyRegistryAdapter(adapterId_) returns (bytes32) {
        Adapter memory adapter = registryAddress.getAdapter(adapterId_);

        App memory app = App({
            adapter: adapter,
            appAddress: appAddress_,
            owner: msg.sender,
            createdAt: block.timestamp
        });

        bytes32 appId = _generateId(appAddress_, msg.sender);

        _apps[appId] = app;

        emit IHub.Hub_AppCreated(appId);

        return appId;
    }

    function _generateId(address appAddress_, address sender_) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(appAddress_, sender_));
    }

    function getApp(bytes32 appId_) external view returns (App memory) {
        return _apps[appId_];
    }
}
