// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";

contract LayerZeroAdapter is AccessManaged {
    constructor(address accessManagement_) AccessManaged(accessManagement_) {}
}
