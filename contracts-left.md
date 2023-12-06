## Contracts

do not use this contract, is just a test

router: 0x70499c328e1e2a3c41108bd3730f6670a44595d1
chainid: 12532609583862916517

# Deploy bridge

=========================
pnpm hardhat deploy-bridge-contract --network 80001

# Deploy adapter

=========================

pnpm hardhat deploy-adapter-contract --network 80001 --adapter "CCIPAdapter" --bridge-address 0xAC4c62F5aeBfc879AeB4A3b919be608980E73D56 --router-address 0x70499c328e1e2a3c41108bd3730f6670a44595d1 --fee-token-name LINK

# Set chain settings

=========================

pnpm hardhat set-chain-settings --network 80001 --bridge-address 0xAC4c62F5aeBfc879AeB4A3b919be608980E73D56 --evm-chain-id 43113 --non-evm-chain-id 14767482510784806043 --adapter-address 0x45ACa774719B311fF4DA05724866DdBC18f3e31c ---target-adapter-address 0x01Dfab90DC8C8E5F66E3fB51009B4c5D8820e44f --is-enabled true --gas-limit 4000000

# Bridge ERC721 using ERC20 token as fee

=========================

pnpm hardhat bridge-erc721-using-erc20 --network 80001 --token-name "hello" --token-symbol "world" --bridge-address 0xAC4c62F5aeBfc879AeB4A3b919be608980E73D56 --adapter-address 0x45ACa774719B311fF4DA05724866DdBC18f3e31c --target-network 43113 --fee-token-name LINK

# Execute

pnpm hardhat execute-message --network 80001 --adapter-address 0x989BdC1DC4d116d30edc8Fd8D2465a0cD0E273b5

# Setup bridge adapter roles

=========================

pnpm hardhat setup-bridge-adapter --network 80001 --bridge-address 0x7afB1dC8685AEf673119D717109b631eb8116d42 --adapter-address 0xb49eBCDB0081baD196e7Bff41fA1614149Ce6eEB --adapter-router-address 0x70499c328e1e2a3c41108bd3730f6670a44595d1 --router-to-adapter-function-selector ccipReceive ----bridge-to-adapter-function-selector sendMessageUsingERC20 --adapter-contract-name CCIPAdapter

# Verify

=========================

pnpm hardhat verify --network 80001 --contract contracts/adapters/CCIPAdapter.sol:CCIPAdapter 0x45ACa774719B311fF4DA05724866DdBC18f3e31c 0xAC4c62F5aeBfc879AeB4A3b919be608980E73D56 0xBbd6d4dC3BF45fdbc286a01916eb7611b727957c 0x70499c328e1e2a3c41108bd3730f6670a44595d1 0x326C977E6efc84E512bB9C30f76E30c160eD06FB

pnpm hardhat verify --network 80001 --contract contracts/Bridge.sol:Bridge 0xAC4c62F5aeBfc879AeB4A3b919be608980E73D56 0xBbd6d4dC3BF45fdbc286a01916eb7611b727957c 80001
