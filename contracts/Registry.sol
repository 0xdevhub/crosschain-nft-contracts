// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.21;

import {IRegistry, Adapter} from "./interfaces/IRegistry.sol";
import {Adapter} from "./interfaces/IAdapter.sol";

contract Registry is IRegistry {
    mapping(bytes32 => Adapter) private _adapters;

    modifier AdapterAlreadyExistis(bytes32 adapterType_, address adapterAddress_) {
        bytes32 adapterId = _getAdapterId(adapterType_, adapterAddress_);

        if (_adapters[adapterId].adapterAddress != address(0)) {
            revert IRegistry.Registry_AdapterAlreadyExists(adapterId);
        }
        _;
    }

    modifier AdapterAddressNotZero(address adapterAddress_) {
        if (adapterAddress_ == address(0)) {
            revert IRegistry.Registry_AdapterAddressZero();
        }
        _;
    }

    function createAdapter(
        bytes32 adapterType_,
        address adapterAddress_
    )
        external
        AdapterAddressNotZero(adapterAddress_)
        AdapterAlreadyExistis(adapterType_, adapterAddress_)
        returns (bytes32)
    {
        Adapter memory adapter = Adapter({adapterType: adapterType_, adapterAddress: adapterAddress_, enabled: false});

        bytes32 adapterId = _getAdapterId(adapterType_, adapterAddress_);

        _adapters[adapterId] = adapter;

        emit IRegistry.Registry_AdapterCreated(adapterId);

        return adapterId;
    }

    function _getAdapterId(bytes32 adapterType_, address adapterAddress_) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(adapterType_, adapterAddress_));
    }

    function getAdapter(bytes32 adapterId) external view returns (Adapter memory) {
        return _adapters[adapterId];
    }
}
