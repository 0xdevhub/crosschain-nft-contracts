## Contracts

do not use this contract, is just a test

router: 0x554472a2720e5e7d5d3c817529aba05eed5f82d8
chainid: 14767482510784806043

# Deploy bridge

=========================

pnpm hardhat deploy-bridge-contract --network 43113

# Deploy adapter

=========================

pnpm hardhat deploy-adapter-contract --network 43113 --adapter "CCIPAdapter" --bridge-address 0xb8e9F7292be5105bF31281b74105D48e5578255a --router-address 0x554472a2720e5e7d5d3c817529aba05eed5f82d8 --fee-token-name LINK

# Set chain settings

=========================

pnpm hardhat set-chain-settings --network 43113 --bridge-address 0xb8e9F7292be5105bF31281b74105D48e5578255a --evm-chain-id 80001 --non-evm-chain-id 12532609583862916517 --adapter-address 0x5da3Ef4Cd1437C6b4cFE46b852248A25D605759F ---target-adapter-address 0x3C66f7dC50c6Cd38d90707fD66de6041f7B42518 --is-enabled true --gas-limit 40000000

# Setup bridge adapter roles

================s=========

pnpm hardhat setup-bridge-adapter --network 43113 --bridge-address 0x1BcCE6f7CFFB9bdF23836cD7f59E11D99112022a --adapter-address 0xf56F1C3E2A908eD9BF56BEc2Cb1C290De8A2936E --adapter-router-address 0x966A8C1a84D02a4BF95936386983bCaAfbF1EB52 --router-to-adapter-function-selector ccipReceive ----bridge-to-adapter-function-selector sendMessageUsingERC20 --adapter-contract-name CCIPAdapter

# Bridge ERC721 using ERC20 token as fee

=========================
pnpm hardhat bridge-erc721-using-erc20 --network 43113 --token-name "hello" --token-symbol "world" --bridge-address 0xb8e9F7292be5105bF31281b74105D48e5578255a --adapter-address 0x5da3Ef4Cd1437C6b4cFE46b852248A25D605759F --target-network 80001 --fee-token-name LINK
