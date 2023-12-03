## Contracts

do not use this contract, is just a test

router: 0x70499c328e1e2a3c41108bd3730f6670a44595d1
chainid: 12532609583862916517

# Deploy bridge

=========================
pnpm hardhat deploy-bridge-contract --network 80001

# Deploy adapter

=========================

pnpm hardhat deploy-adapter-contract --network 80001 --adapter "CCIPAdapter" --bridge-address 0x8Dfc565d2514b2727A1f94641C7bA8650F96cfF1 --router-address 0x70499c328e1e2a3c41108bd3730f6670a44595d1 --fee-token-name LINK

# Set chain settings

=========================

pnpm hardhat set-chain-settings --network 80001 --bridge-address 0x8Dfc565d2514b2727A1f94641C7bA8650F96cfF1 --evm-chain-id 43113 --non-evm-chain-id 14767482510784806043 --adapter-address 0x3C66f7dC50c6Cd38d90707fD66de6041f7B42518 ---target-adapter-address 0x5da3Ef4Cd1437C6b4cFE46b852248A25D605759F --is-enabled true --gas-limit 4000000

# Setup bridge adapter roles

=========================

pnpm hardhat setup-bridge-adapter --network 80001 --bridge-address 0x3d7593Ef9d71959b86720e728c1e7469eeDE2d8e --adapter-address 0xA30A80709b97BCc6aF48c570507238627Da85822 --adapter-router-address 0x70499c328e1e2a3c41108bd3730f6670a44595d1 --router-to-adapter-function-selector ccipReceive ----bridge-to-adapter-function-selector sendMessageUsingERC20 --adapter-contract-name CCIPAdapter

# Bridge ERC721 using ERC20 token as fee

=========================

pnpm hardhat bridge-erc721-using-erc20 --network 80001 --token-name "hello" --token-symbol "world" --bridge-address 0x8Dfc565d2514b2727A1f94641C7bA8650F96cfF1 --adapter-address 0x3C66f7dC50c6Cd38d90707fD66de6041f7B42518 --target-network 43113 --fee-token-name LINK
