// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IBaseAdapter {
    event MessageSent(bytes indexed data_);

    event MessageReceived(bytes indexed data_);

    function sendMessage(bytes memory calldata_) external returns (bytes memory);
}
