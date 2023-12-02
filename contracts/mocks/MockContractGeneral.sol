// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockContractGeneral {
    /// @dev it is only for testing purpose, it will try to call an unavaible function
    function transferERC721ViaContract(address token_, uint256 tokenId_, address receiver_) external {
        ERC721(token_).safeTransferFrom(msg.sender, receiver_, tokenId_);
    }
}
