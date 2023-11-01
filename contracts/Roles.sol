// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IRoles} from "./interfaces/IRoles.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

bytes32 constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

contract Roles is AccessControl {
    modifier onlyAdmin() {
        if (!isAdmin(msg.sender)) {
            revert IRoles.Roles_NotAdmin();
        }
        _;
    }

    modifier onlyManager() {
        if (!isManager(msg.sender)) {
            revert IRoles.Roles_NotManager();
        }
        _;
    }

    constructor() {
        _setAdminRole(msg.sender);
    }

    function _setAdminRole(address _address) private {
        _grantRole(DEFAULT_ADMIN_ROLE, _address);
    }

    function isAdmin(address _address) public view returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, _address);
    }

    function isManager(address _address) public view returns (bool) {
        return hasRole(MANAGER_ROLE, _address);
    }

    function setManager(address _address) external onlyAdmin {
        _grantRole(MANAGER_ROLE, _address);
    }
}
