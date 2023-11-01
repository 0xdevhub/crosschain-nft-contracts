// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IHub} from "./interfaces/IHub.sol";
import {IRegistry} from "./interfaces/IRegistry.sol";
import {App} from "./interfaces/IApp.sol";
import {Adapter} from "./interfaces/IAdapter.sol";
import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";

contract Hub is IHub, AccessManaged {
    IRegistry public immutable registryAddress;
    uint256 private _appIdSalt;

    mapping(bytes32 => App) private _apps;

    constructor(IRegistry registryAddress_, address accessManagement_) AccessManaged(accessManagement_) {
        registryAddress = registryAddress_;
    }

    modifier checkIsRegistryAdapter(bytes32 adapterId_) {
        if (!registryAddress.isAdapter(adapterId_)) {
            revert IHub.Hub_AdapterNotFound(adapterId_);
        }
        _;
    }

    function createApp(
        bytes32 adapterId_,
        address appAddress_
    ) external checkIsRegistryAdapter(adapterId_) restricted returns (bytes32) {
        App memory app = App({adapter: _getRegistryAdapter(adapterId_), appAddress: appAddress_});

        bytes32 appId = keccak256(abi.encodePacked(_appIdSalt++, appAddress_, msg.sender));

        _apps[appId] = app;

        emit IHub.Hub_AppCreated(appId);

        return appId;
    }

    function _getRegistryAdapter(bytes32 adapterId_) internal view returns (Adapter memory) {
        return registryAddress.getAdapter(adapterId_);
    }

    function getApp(bytes32 appId_) external view returns (App memory) {
        return _apps[appId_];
    }
}
