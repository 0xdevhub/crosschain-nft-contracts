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

    /**
     * @notice get bridge address that handle income/outcome messages
     */
    function getBridge() external view returns (address);

    /**
     * @notice get fee token address, if zero address it will be set to native token
     */
    function feeToken() external view returns (address);

    /**
     * @notice get fee amount require for sending message
     * @param payload_ message payload
     */
    function getFee(MessageSend memory payload_) external view returns (uint256);

    /**
     * @notice send message using Native token
     * @param payload_ message payload
     */
    function sendMessageUsingNative(MessageSend memory payload_) external payable;

    /**
     * @notice send message using ERC20 token
     * @param payload_ message payload
     */

    function sendMessageUsingERC20(MessageSend memory payload_, uint256 amount_) external;
}
