// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";

/**
 * @title Fees
 * @notice This contract is used to handle protocol Fees
 */

contract Fees is AccessManaged {
    constructor(address accessManagement_) AccessManaged(accessManagement_) {}

    function setBridgeFee() external {}
}
