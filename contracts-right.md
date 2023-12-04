## Contracts

do not use this contract, is just a test

router: 0x554472a2720e5e7d5d3c817529aba05eed5f82d8
chainid: 14767482510784806043

# Deploy bridge

=========================

pnpm hardhat deploy-bridge-contract --network 43113

# Deploy adapter

=========================

pnpm hardhat deploy-adapter-contract --network 43113 --adapter "CCIPAdapter" --bridge-address 0x7b9Dbf30BB2144b22f612B2bf7f02cb9dB36Bca1 --router-address 0x554472a2720e5e7d5d3c817529aba05eed5f82d8 --fee-token-name LINK

# Set chain settings

=========================

pnpm hardhat set-chain-settings --network 43113 --bridge-address 0x7b9Dbf30BB2144b22f612B2bf7f02cb9dB36Bca1 --evm-chain-id 80001 --non-evm-chain-id 12532609583862916517 --adapter-address 0x940D6921A7931AFB07107323118F2151DCBCF2eC ---target-adapter-address 0xaE784bC30BC8D29f9493a4366137bF371775159f --is-enabled true --gas-limit 4000000

# Setup bridge adapter roles

================s=========

pnpm hardhat setup-bridge-adapter --network 43113 --bridge-address 0xFB6F96b38AEaA0489FC0eEee8B105484f2111d99 --adapter-address 0xFaA94F0D45e70dc672A796Eafb6E21475a62Db9C --adapter-router-address 0x966A8C1a84D02a4BF95936386983bCaAfbF1EB52 --router-to-adapter-function-selector ccipReceive ----bridge-to-adapter-function-selector sendMessageUsingERC20 --adapter-contract-name CCIPAdapter

# Bridge ERC721 using ERC20 token as fee

=========================
pnpm hardhat bridge-erc721-using-erc20 --network 43113 --token-name "hello" --token-symbol "world" --bridge-address 0x7b9Dbf30BB2144b22f612B2bf7f02cb9dB36Bca1 --adapter-address 0x940D6921A7931AFB07107323118F2151DCBCF2eC --target-network 80001 --fee-token-name LINK
