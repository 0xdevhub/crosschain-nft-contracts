// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {Adapter} from "./IAdapter.sol";

interface IRegistry {
    event Registry_AdapterCreated(bytes32 indexed adapterId);

    function createAdapter(bytes32 adapterType_, address adapterAddress_) external returns (bytes32);

    function getAdapter(bytes32 adapterId) external view returns (Adapter memory);

    function isAdapter(bytes32 adapterId) external view returns (bool);
}
