// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";

/**
 * @title Router
 * @notice This contract is used to handle protocol entry point
 */

contract Router is AccessManaged {
    constructor(address accessManagement_) AccessManaged(accessManagement_) {}
}
