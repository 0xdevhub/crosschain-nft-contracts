## Contracts

do not use this contract, is just a test

router: 0x554472a2720e5e7d5d3c817529aba05eed5f82d8
chainid: 14767482510784806043

# Deploy bridge

=========================

pnpm hardhat deploy-bridge-contract --network 43113

# Deploy adapter

=========================

pnpm hardhat deploy-adapter-contract --network 43113 --adapter "CCIPAdapter" --bridge-address 0x6A1c74Cb92A81c46c6e11D18Dc0543A65926b0eb --router-address 0x554472a2720e5e7d5d3c817529aba05eed5f82d8 --fee-token-name LINK

# Set chain settings

=========================

pnpm hardhat set-chain-settings --network 43113 --bridge-address 0x6A1c74Cb92A81c46c6e11D18Dc0543A65926b0eb --evm-chain-id 80001 --non-evm-chain-id 12532609583862916517 --adapter-address 0xd7a528C92081cAE52Bc45e0170C4Ae45A93d844F ---target-adapter-address 0x7c456Ed3b44a1a10AC9D68d14867a2f8A4358B2A --is-enabled true

# Setup bridge adapter roles

=========================

pnpm hardhat setup-bridge-adapter --network 43113 --bridge-address 0x6A1c74Cb92A81c46c6e11D18Dc0543A65926b0eb --adapter-address 0xd7a528C92081cAE52Bc45e0170C4Ae45A93d844F --adapter-router-address 0x554472a2720e5e7d5d3c817529aba05eed5f82d8 --router-to-adapter-function-selector ccipReceive ----bridge-to-adapter-function-selector sendMessageUsingERC20 --adapter-contract-name CCIPAdapter

# Bridge ERC721 using ERC20 token as fee

=========================
pnpm hardhat bridge-erc721-using-erc20 --network 43113 --token-name "hello" --token-symbol "world" --bridge-address 0x6A1c74Cb92A81c46c6e11D18Dc0543A65926b0eb --adapter-address 0xd7a528C92081cAE52Bc45e0170C4Ae45A93d844F --target-network 80001 --fee-token-name LINK
