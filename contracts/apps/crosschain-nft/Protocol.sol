// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";

contract Protocol is AccessManaged {
    constructor(address accessManagement_) AccessManaged(accessManagement_) {}

    /// @dev from original to wrapped
    function lockAndMintERC721() external {}

    /// @dev from wrapped to origina
    function burnAndUnlockERC721() external {}
}
