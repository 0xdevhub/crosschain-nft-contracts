// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface IBaseAdapter {
    struct MessageReceive {
        uint256 fromChain;
        address sender;
        bytes data;
    }

    struct MessageSend {
        uint256 toChain;
        address receiver;
        bytes data;
        uint256 gasLimit;
    }

    error InsufficientFeeTokenAmount();

    error FallbackNotAllowed();

    error DepositNotAllowed();

    event MessageSent(uint256 toChain_, address receiver_, bytes data_);

    event MessageReceived(uint256 fromChain_, address sender_, bytes data_);

    function getBridge() external view returns (address);

    function feeToken() external view returns (address);

    function getFee(MessageSend memory payload_) external view returns (uint256);

    function sendMessageUsingNative(MessageSend memory payload_) external payable;

    function sendMessageUsingERC20(MessageSend memory payload_, uint256 amount_) external;
}
