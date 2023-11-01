// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface IRoles {
    error Roles_NotAdmin();

    error Roles_NotManager();

    function setManager(address _address) external;

    function isManager(address _address) external view returns (bool);

    function isAdmin(address _address) external view returns (bool);
}
