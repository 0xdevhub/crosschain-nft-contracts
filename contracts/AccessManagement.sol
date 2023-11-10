// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import "@openzeppelin/contracts/access/manager/AccessManager.sol";

/**
 * @title AccessManagement
 * @notice This contract is used to manage access to the protocol
 */

contract AccessManagement is AccessManager {
    constructor(address admin) AccessManager(admin) {}
}
