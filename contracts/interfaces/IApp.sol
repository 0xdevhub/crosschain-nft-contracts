// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {Adapter} from "./IAdapter.sol";

struct App {
    address appAddress;
    Adapter adapter;
}
