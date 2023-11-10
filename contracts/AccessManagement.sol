// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import "@openzeppelin/contracts/access/manager/AccessManager.sol";

contract AccessManagement is AccessManager {
    constructor(address admin) AccessManager(admin) {}
}
