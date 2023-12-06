## Contracts

do not use this contract, is just a test

router: 0x70499c328e1e2a3c41108bd3730f6670a44595d1
chainid: 12532609583862916517

# Deploy bridge

=========================
pnpm hardhat deploy-bridge-contract --network 80001

# Deploy adapter

=========================

pnpm hardhat deploy-adapter-contract --network 80001 --adapter "CCIPAdapter" --bridge-address 0x2d834f337BB3aBb451aB0D05afeeAa4B88a5A930 --router-address 0x70499c328e1e2a3c41108bd3730f6670a44595d1 --fee-token-name LINK

# Set chain settings

=========================

pnpm hardhat set-chain-settings --network 80001 --bridge-address 0x2d834f337BB3aBb451aB0D05afeeAa4B88a5A930 --evm-chain-id 43113 --non-evm-chain-id 14767482510784806043 --adapter-address 0xc51B10A545d646A6D648F6e25B037D07B9ED1211 ---target-adapter-address 0xe929743b5e4Ec0966bDc08dF8320802BD5A8C63D --is-enabled true --gas-limit 4000000

# Setup bridge adapter roles

=========================

pnpm hardhat setup-bridge-adapter --network 80001 --bridge-address 0x2d834f337BB3aBb451aB0D05afeeAa4B88a5A930 --adapter-address 0xc51B10A545d646A6D648F6e25B037D07B9ED1211 --adapter-router-address 0x70499c328e1e2a3c41108bd3730f6670a44595d1 --router-to-adapter-function-selector ccipReceive ----bridge-to-adapter-function-selector sendMessageUsingERC20 --adapter-contract-name CCIPAdapter

# Verify

=========================

pnpm hardhat verify --network 80001 --contract contracts/adapters/CCIPAdapter.sol:CCIPAdapter 0xc51B10A545d646A6D648F6e25B037D07B9ED1211 0x2d834f337BB3aBb451aB0D05afeeAa4B88a5A930 0xBbd6d4dC3BF45fdbc286a01916eb7611b727957c 0x70499c328e1e2a3c41108bd3730f6670a44595d1 0x326C977E6efc84E512bB9C30f76E30c160eD06FB

pnpm hardhat verify --network 80001 --contract contracts/Bridge.sol:Bridge 0x2d834f337BB3aBb451aB0D05afeeAa4B88a5A930 0xBbd6d4dC3BF45fdbc286a01916eb7611b727957c 80001

# Bridge ERC721 using ERC20 token as fee

=========================

pnpm hardhat bridge-erc721-using-erc20 --network 80001 --token-name "hello" --token-symbol "world" --bridge-address 0x2d834f337BB3aBb451aB0D05afeeAa4B88a5A930 --adapter-address 0xc51B10A545d646A6D648F6e25B037D07B9ED1211 --target-network 43113 --fee-token-name LINK

# Execute

pnpm hardhat execute-message --network 80001 --adapter-address 0x989BdC1DC4d116d30edc8Fd8D2465a0cD0E273b5
