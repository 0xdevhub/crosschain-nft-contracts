## Contracts

do not use this contract, is just a test

router: 0x554472a2720e5e7d5d3c817529aba05eed5f82d8
chainid: 14767482510784806043

# Deploy bridge

=========================

pnpm hardhat deploy-bridge-contract --network 43113

# Deploy adapter

=========================

pnpm hardhat deploy-adapter-contract --network 43113 --adapter "CCIPAdapter" --bridge-address 0x0214f538B87996Dc42924DCeeb84023D01C50dFC --router-address 0x554472a2720e5e7d5d3c817529aba05eed5f82d8 --fee-token-name LINK

# Set chain settings

=========================

pnpm hardhat set-chain-settings --network 43113 --bridge-address 0x0214f538B87996Dc42924DCeeb84023D01C50dFC --evm-chain-id 80001 --non-evm-chain-id 12532609583862916517 --adapter-address 0x01Dfab90DC8C8E5F66E3fB51009B4c5D8820e44f ---target-adapter-address 0x45ACa774719B311fF4DA05724866DdBC18f3e31c --is-enabled true --gas-limit 4000000

# Bridge ERC721 using ERC20 token as fee

=========================
pnpm hardhat bridge-erc721-using-erc20 --network 43113 --token-name "hello" --token-symbol "world" --bridge-address 0x0214f538B87996Dc42924DCeeb84023D01C50dFC --adapter-address 0x01Dfab90DC8C8E5F66E3fB51009B4c5D8820e44f --target-network 80001 --fee-token-name LINK

# Execute

==========================
pnpm hardhat execute-message --network 43113 --adapter-address 0x7f188288e39197B7e55EC4E08a9f19f56A8580e8

# Setup bridge adapter roles

==========================

pnpm hardhat setup-bridge-adapter --network 43113 --bridge-address 0xFB6F96b38AEaA0489FC0eEee8B105484f2111d99 --adapter-address 0xFaA94F0D45e70dc672A796Eafb6E21475a62Db9C --adapter-router-address 0x966A8C1a84D02a4BF95936386983bCaAfbF1EB52 --router-to-adapter-function-selector ccipReceive ----bridge-to-adapter-function-selector sendMessageUsingERC20 --adapter-contract-name CCIPAdapter

# Verify

=========================

pnpm hardhat verify --network 43113 --contract contracts/adapters/CCIPAdapter.sol:CCIPAdapter 0x01Dfab90DC8C8E5F66E3fB51009B4c5D8820e44f 0x0214f538B87996Dc42924DCeeb84023D01C50dFC 0x554472a2720e5e7d5d3c817529aba05eed5f82d8 0x7953C478A5F5d53C263Bd1251BfC4c418d8C5568 0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846

pnpm hardhat verify --network 43113 --contract contracts/Bridge.sol:Bridge 0x0214f538B87996Dc42924DCeeb84023D01C50dFC 0x7953C478A5F5d53C263Bd1251BfC4c418d8C5568 43113
