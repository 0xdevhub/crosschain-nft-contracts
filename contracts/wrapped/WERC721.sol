// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract WERC721 is ERC721 {
    address private s_bridgeAddress;

    mapping(uint256 tokenId => string) private s_tokenURIs;

    error OnlyBridge();

    constructor(address bridgeAddress_, string memory name_, string memory symbol_) ERC721(name_, symbol_) {
        s_bridgeAddress = bridgeAddress_;
    }

    modifier onlyBridge() {
        if (msg.sender != s_bridgeAddress) revert OnlyBridge();
        _;
    }

    function bridgeMint(address to, uint256 tokenId, string memory uri) public onlyBridge {
        _mint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function bridgeBurn(uint256 tokenId) public onlyBridge {
        _burn(tokenId);
    }

    function tokenURI(uint256 tokenId_) public view override returns (string memory) {
        _requireOwned(tokenId_);
        return s_tokenURIs[tokenId_];
    }

    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
        s_tokenURIs[tokenId] = _tokenURI;
    }
}
