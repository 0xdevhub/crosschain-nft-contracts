## Contracts

do not use this contract, is just a test

router: 0x70499c328e1e2a3c41108bd3730f6670a44595d1
chainid: 12532609583862916517

# Deploy bridge

=========================
pnpm hardhat deploy-bridge-contract --network 80001

# Deploy adapter

=========================

pnpm hardhat deploy-adapter-contract --network 80001 --adapter "CCIPAdapter" --bridge-address 0xBA70e221fF13Ace063868304719D9C67Aa274989 --router-address 0x70499c328e1e2a3c41108bd3730f6670a44595d1 --fee-token-name LINK

# Set chain settings

=========================

pnpm hardhat set-chain-settings --network 80001 --bridge-address 0xBA70e221fF13Ace063868304719D9C67Aa274989 --evm-chain-id 43113 --non-evm-chain-id 14767482510784806043 --adapter-address 0x533088e7bC6eC082F64BE2F54E303aFc8358ed24 ---target-adapter-address 0xB0c0867cA7a90f7F33D3f65fCb53B1259CCeC291 --is-enabled true --gas-limit 4000000

# Setup bridge adapter roles

=========================

pnpm hardhat setup-bridge-adapter --network 80001 --bridge-address 0xBA70e221fF13Ace063868304719D9C67Aa274989 --adapter-address 0x533088e7bC6eC082F64BE2F54E303aFc8358ed24 --adapter-router-address 0x70499c328e1e2a3c41108bd3730f6670a44595d1 --router-to-adapter-function-selector ccipReceive ----bridge-to-adapter-function-selector sendMessageUsingERC20 --adapter-contract-name CCIPAdapter

# Verify

=========================

pnpm hardhat verify --network 80001 --contract contracts/Bridge.sol:Bridge 0xBA70e221fF13Ace063868304719D9C67Aa274989 0xBbd6d4dC3BF45fdbc286a01916eb7611b727957c 80001

pnpm hardhat verify --network 80001 --contract contracts/adapters/CCIPAdapter.sol:CCIPAdapter 0x533088e7bC6eC082F64BE2F54E303aFc8358ed24 0xBA70e221fF13Ace063868304719D9C67Aa274989 0xBbd6d4dC3BF45fdbc286a01916eb7611b727957c 0x70499c328e1e2a3c41108bd3730f6670a44595d1 0x326C977E6efc84E512bB9C30f76E30c160eD06FB

# Bridge ERC721 using ERC20 token as fee

=========================

pnpm hardhat bridge-erc721-using-erc20 --network 80001 --token-name "Doodle" --token-symbol "DOD" --bridge-address 0xBA70e221fF13Ace063868304719D9C67Aa274989 --adapter-address 0x533088e7bC6eC082F64BE2F54E303aFc8358ed24 --target-network 43113 --fee-token-name LINK

# Execute

pnpm hardhat execute-message --network 80001 --adapter-address 0x533088e7bC6eC082F64BE2F54E303aFc8358ed24

=========================

pnpm hardhat bridge-erc721 --network 80001 --token-address 0x46bef163d6c470a4774f9585f3500ae3b642e751 --token-id 529 --bridge-address 0xBA70e221fF13Ace063868304719D9C67Aa274989 --adapter-address 0x533088e7bC6eC082F64BE2F54E303aFc8358ed24 --target-network 43113 --fee-token-name LINK --origin-chain-evm-id 80001
