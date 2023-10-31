// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.21;

import {Adapter} from "./IAdapter.sol";

interface IRegistry {
    event Registry_AdapterCreated(bytes32 indexed adapterId);

    error Registry_AdapterAlreadyExists(bytes32 adapterId);

    error Registry_AdapterAddressZero();

    function createAdapter(bytes32 adapterType_, address adapterAddress_) external returns (bytes32);

    function getAdapter(bytes32 adapterId) external view returns (Adapter memory);
}
