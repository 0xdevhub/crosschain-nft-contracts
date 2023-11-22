// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MockNFT is ERC721, ERC721URIStorage {
    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

    function mint(uint256 tokenId) public {
        _mint(msg.sender, tokenId);
    }

    function safeMint(address to, uint256 tokenId, string memory uri) public {
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function burn(uint256 tokenId) public {
        _burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
