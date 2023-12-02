// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IBridge} from "../interfaces/IBridge.sol";

interface IBaseAdapter {
    error InsufficientFeeTokenAmount();

    error FallbackNotAllowed();

    error DepositNotAllowed();

    event ERC721Sent(uint256 toChain_, address receiver_, bytes data_);

    event ERC721Receive(uint256 fromChain_, address sender_, bytes data_);

    function router() external view returns (address);

    function bridge() external view returns (address);

    function feeToken() external view returns (address);

    function getFee(IBridge.ERC721Send memory payload_) external view returns (uint256);

    function sendMessageUsingNative(IBridge.ERC721Send memory payload_) external payable;

    function sendMessageUsingERC20(IBridge.ERC721Send memory payload_, uint256 amount_) external;
}
