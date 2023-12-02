## Contracts

do not use this contract, is just a test

router: 0x70499c328e1e2a3c41108bd3730f6670a44595d1
chainid: 12532609583862916517

# Deploy bridge

=========================
pnpm hardhat deploy-bridge-contract --network 80001

# Deploy adapter

=========================

pnpm hardhat deploy-adapter-contract --network 80001 --adapter "CCIPAdapter" --bridge-address 0x311353f8A4F9195f7eD005112948197e4518E8a1 --router-address 0x70499c328e1e2a3c41108bd3730f6670a44595d1 --fee-token-name LINK

# Set chain settings

=========================

pnpm hardhat set-chain-settings --network 80001 --bridge-address 0x311353f8A4F9195f7eD005112948197e4518E8a1 --evm-chain-id 43113 --non-evm-chain-id 14767482510784806043 --adapter-address 0x7c456Ed3b44a1a10AC9D68d14867a2f8A4358B2A ---target-adapter-address 0xd7a528C92081cAE52Bc45e0170C4Ae45A93d844F --is-enabled true

# Setup bridge adapter roles

=========================

pnpm hardhat setup-bridge-adapter --network 80001 --bridge-address 0x311353f8A4F9195f7eD005112948197e4518E8a1 --adapter-address 0x7c456Ed3b44a1a10AC9D68d14867a2f8A4358B2A --adapter-router-address 0x70499c328e1e2a3c41108bd3730f6670a44595d1 --router-to-adapter-function-selector ccipReceive ----bridge-to-adapter-function-selector sendMessageUsingERC20 --adapter-contract-name CCIPAdapter

# Bridge ERC721 using ERC20 token as fee

=========================

pnpm hardhat bridge-erc721-using-erc20 --network 80001 --token-name "hello" --token-symbol "world" --bridge-address 0x311353f8A4F9195f7eD005112948197e4518E8a1 --adapter-address 0x7c456Ed3b44a1a10AC9D68d14867a2f8A4358B2A --target-network 43113 --fee-token-name LINK
