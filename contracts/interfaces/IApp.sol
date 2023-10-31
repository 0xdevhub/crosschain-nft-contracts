// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.21;

enum AppType {
    Vault
}

struct App {
    address owner;
    uint256 createdAt;
    AppType appType;
    address appAddress;
}
