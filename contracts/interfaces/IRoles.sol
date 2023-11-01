// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.21;

interface IRoles {
    error Roles_NotRoleManager();

    function isManager(address _address) external view returns (bool);
}
