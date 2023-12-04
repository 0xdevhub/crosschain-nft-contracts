## Contracts

do not use this contract, is just a test

router: 0x70499c328e1e2a3c41108bd3730f6670a44595d1
chainid: 12532609583862916517

# Deploy bridge

=========================
pnpm hardhat deploy-bridge-contract --network 80001

# Deploy adapter

=========================

pnpm hardhat deploy-adapter-contract --network 80001 --adapter "CCIPAdapter" --bridge-address 0x89d50fBE79D31CBF1d9661f411C7865b611AC6f9 --router-address 0x70499c328e1e2a3c41108bd3730f6670a44595d1 --fee-token-name LINK

# Set chain settings

=========================

pnpm hardhat set-chain-settings --network 80001 --bridge-address 0x89d50fBE79D31CBF1d9661f411C7865b611AC6f9 --evm-chain-id 43113 --non-evm-chain-id 14767482510784806043 --adapter-address 0xaE784bC30BC8D29f9493a4366137bF371775159f ---target-adapter-address 0x940D6921A7931AFB07107323118F2151DCBCF2eC --is-enabled true --gas-limit 4000000

# Setup bridge adapter roles

=========================

pnpm hardhat setup-bridge-adapter --network 80001 --bridge-address 0xAF954C2fcdcf01B891eA267224E3781E9B0Ed9AC --adapter-address 0x66d51e543a7C58a83dE2924bcc6Eca83866C3A7d --adapter-router-address 0x70499c328e1e2a3c41108bd3730f6670a44595d1 --router-to-adapter-function-selector ccipReceive ----bridge-to-adapter-function-selector sendMessageUsingERC20 --adapter-contract-name CCIPAdapter

# Bridge ERC721 using ERC20 token as fee

=========================

pnpm hardhat bridge-erc721-using-erc20 --network 80001 --token-name "hello" --token-symbol "world" --bridge-address 0x89d50fBE79D31CBF1d9661f411C7865b611AC6f9 --adapter-address 0xaE784bC30BC8D29f9493a4366137bF371775159f --target-network 43113 --fee-token-name LINK
