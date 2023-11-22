// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";

contract MockCCIPRouter is IRouterClient {
    uint256 public s_fee;

    event ERC721Receive(uint64 indexed destinationChainSelector, Client.EVM2AnyMessage indexed evm2AnyMessage);

    /// @dev only for test purpose
    function setFee(uint256 fee_) external {
        s_fee = fee_;
    }

    function isChainSupported(uint64 /*chainSelector */) external pure returns (bool supported) {}

    function getSupportedTokens(uint64 /* chainSelector */) external pure returns (address[] memory tokens) {}

    function getFee(
        uint64 /*destinationChainSelector*/,
        Client.EVM2AnyMessage memory /*message*/
    ) external view returns (uint256) {
        return s_fee;
    }

    function ccipSend(
        uint64 /*destinationChainSelector*/,
        Client.EVM2AnyMessage calldata /*message*/
    ) external payable returns (bytes32) {
        /// @dev only for test purpose
        payable(address(this)).transfer(msg.value);
        return bytes32(0);
    }

    /// @dev only for test purpose
    function balance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @dev only for test purpose
    receive() external payable {}
}
