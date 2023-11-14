// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";

contract MockCCIPRouter is IRouterClient {
    uint256 public s_fee;

    event MessageReceived(uint64 indexed destinationChainSelector, Client.EVM2AnyMessage indexed evm2AnyMessage);

    /// @dev only for test purpose
    function setFee(uint256 fee_) external {
        s_fee = fee_;
    }

    function isChainSupported(uint64 /*chainSelector */) external pure returns (bool supported) {
        return true;
    }

    function getSupportedTokens(uint64 /* chainSelector */) external pure returns (address[] memory tokens) {
        return new address[](0);
    }

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
        return bytes32(0);
    }
}
