// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.21;

import {IRegistry, Adapter} from "./interfaces/IRegistry.sol";
import {Adapter} from "./interfaces/IAdapter.sol";
import {Roles} from "./Roles.sol";

contract Registry is IRegistry, Roles {
    mapping(bytes32 => Adapter) private _adapters;

    function createAdapter(bytes32 adapterType_, address adapterAddress_) external OnlyManager returns (bytes32) {
        Adapter memory adapter = Adapter({adapterType: adapterType_, adapterAddress: adapterAddress_, enabled: false});

        bytes32 adapterId = _generateId(adapterType_, adapterAddress_);

        _adapters[adapterId] = adapter;

        emit IRegistry.Registry_AdapterCreated(adapterId);

        return adapterId;
    }

    function _generateId(bytes32 adapterType_, address adapterAddress_) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(adapterType_, adapterAddress_));
    }

    function getAdapter(bytes32 adapterId) external view returns (Adapter memory) {
        return _adapters[adapterId];
    }

    function isAdapter(bytes32 adapterId) external view returns (bool) {
        return _adapters[adapterId].adapterAddress != address(0);
    }
}
