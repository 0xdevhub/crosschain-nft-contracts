// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";

/**
 * @title Bridge
 * @notice This contract is used to handle protocol bridge
 */

contract Bridge is AccessManaged {
    constructor(address accessManagement_) AccessManaged(accessManagement_) {}
}
