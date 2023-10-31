// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.21;

import "./interfaces/IRoles.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Roles is AccessControl {
    modifier OnlyManager() {
        if (!hasRole(MANAGER_ROLE, msg.sender)) {
            revert Roles_NotRoleManager();
        }
        _;
    }

    constructor() {
        _setManagerRole(msg.sender);
    }

    function _setManagerRole(address _address) internal {
        _grantRole(MANAGER_ROLE, _address);
    }
}
